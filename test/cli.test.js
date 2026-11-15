'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');

const packageRoot = path.resolve(__dirname, '..');
const cli = path.join(packageRoot, 'bin', 'cli.js');
const skills = ['generate-playwright-tests', 'bug-reporting'];

function workspace(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'playwright-skills-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const project = path.join(root, 'project');
  const home = path.join(root, 'home');
  fs.mkdirSync(project);
  fs.mkdirSync(home);
  return {
    root,
    project,
    home,
    run(args, env = {}) {
      return spawnSync(process.execPath, [cli, ...args], {
        cwd: project,
        encoding: 'utf8',
        env: {
          ...process.env,
          HOME: home,
          USERPROFILE: home,
          INIT_CWD: '',
          npm_config_global: 'false',
          ...env,
        },
      });
    },
  };
}

function success(result) {
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

function assertInstalled(root) {
  for (const skill of skills) {
    assert.equal(
      fs.readFileSync(path.join(root, skill, 'SKILL.md'), 'utf8'),
      fs.readFileSync(path.join(packageRoot, 'skills', skill, 'SKILL.md'), 'utf8'),
    );
  }
}

test('help lists both skills without installing them', (t) => {
  const w = workspace(t);
  const result = w.run([]);
  success(result);
  for (const skill of skills) assert.ok(result.stdout.includes(skill));
  assert.equal(fs.existsSync(path.join(w.project, '.claude')), false);
});

test('local installation copies both skills and can be repeated', (t) => {
  const w = workspace(t);
  success(w.run(['install']));
  const root = path.join(w.project, '.claude', 'skills');
  assertInstalled(root);
  const repeated = w.run(['install']);
  success(repeated);
  assert.match(repeated.stdout, /Already up to date/);
  assertInstalled(root);
});

test('custom installation supports paths with spaces', (t) => {
  const w = workspace(t);
  const root = path.join(w.root, 'custom skills');
  success(w.run(['install', '--dir', root]));
  assertInstalled(root);
  assert.equal(fs.existsSync(path.join(w.project, '.claude')), false);
});

test('global installation uses the home skills folder', (t) => {
  const w = workspace(t);
  success(w.run(['install', '--global']));
  const root = path.join(w.home, '.claude', 'skills');
  assertInstalled(root);
  success(w.run(['uninstall', '--global']));
  for (const skill of skills) assert.equal(fs.existsSync(path.join(root, skill)), false);
});

test('an unchanged legacy installation gains the new skill', (t) => {
  const w = workspace(t);
  const root = path.join(w.project, '.claude', 'skills');
  fs.mkdirSync(root, { recursive: true });
  fs.cpSync(path.join(packageRoot, 'skills', skills[0]), path.join(root, skills[0]), {
    recursive: true,
  });
  success(w.run(['install']));
  assertInstalled(root);
});

test('conflicts prevent partial installs and force updates both skills', (t) => {
  const w = workspace(t);
  const root = path.join(w.project, '.claude', 'skills');
  const conflictingFile = path.join(root, 'bug-reporting', 'SKILL.md');
  fs.mkdirSync(path.dirname(conflictingFile), { recursive: true });
  fs.writeFileSync(conflictingFile, 'Local changes');
  const result = w.run(['install']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Use --force/);
  assert.equal(fs.readFileSync(conflictingFile, 'utf8'), 'Local changes');
  assert.equal(fs.existsSync(path.join(root, skills[0])), false);
  success(w.run(['install', '--force']));
  assertInstalled(root);
});

test('uninstall removes both skills and preserves unrelated skills', (t) => {
  const w = workspace(t);
  const root = path.join(w.root, 'custom');
  success(w.run(['install', '--dir', root]));
  const unrelated = path.join(root, 'another-skill', 'SKILL.md');
  fs.mkdirSync(path.dirname(unrelated));
  fs.writeFileSync(unrelated, 'Unrelated skill');
  success(w.run(['uninstall', '--dir', root]));
  for (const skill of skills) assert.equal(fs.existsSync(path.join(root, skill)), false);
  assert.equal(fs.readFileSync(unrelated, 'utf8'), 'Unrelated skill');
  assert.equal(w.run(['uninstall', '--dir', root]).status, 1);
});

test('uninstall supports installations containing only one bundled skill', (t) => {
  const w = workspace(t);
  const root = path.join(w.project, '.claude', 'skills');
  for (const skill of skills) {
    fs.mkdirSync(path.join(root, skill), { recursive: true });
    success(w.run(['uninstall']));
    assert.equal(fs.existsSync(path.join(root, skill)), false);
  }
});

test('a missing custom directory argument fails without installing', (t) => {
  const w = workspace(t);
  for (const args of [['install', '--dir'], ['install', '--dir', '--force']]) {
    const result = w.run(args);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /--dir needs a path/);
  }
  assert.equal(fs.existsSync(path.join(w.project, '.claude')), false);
});

test('postinstall copies both skills into the consuming project', (t) => {
  const w = workspace(t);
  success(w.run(['postinstall'], { INIT_CWD: w.project }));
  assertInstalled(path.join(w.project, '.claude', 'skills'));
});

test('global postinstall copies both skills into the home skills folder', (t) => {
  const w = workspace(t);
  success(w.run(['postinstall'], { npm_config_global: 'true' }));
  assertInstalled(path.join(w.home, '.claude', 'skills'));
});

test('postinstall skips missing and package-local INIT_CWD', (t) => {
  const w = workspace(t);
  success(w.run(['postinstall']));
  success(w.run(['postinstall'], { INIT_CWD: packageRoot }));
  assert.equal(fs.existsSync(path.join(w.project, '.claude')), false);
});

test('postinstall reports copy failures without failing npm installation', (t) => {
  const w = workspace(t);
  fs.writeFileSync(path.join(w.project, '.claude'), 'Blocked destination');
  const result = w.run(['postinstall'], { INIT_CWD: w.project });
  success(result);
  assert.match(result.stderr, /could not copy the skills/);
  assert.match(result.stderr, /npx generate-playwright-tests-skill install/);
});
