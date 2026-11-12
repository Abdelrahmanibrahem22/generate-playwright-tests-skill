#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const SKILL = 'generate-playwright-tests';
const source = path.join(__dirname, '..', 'skills', SKILL);
const args = process.argv.slice(2);
const command = args[0] && !args[0].startsWith('-') ? args[0] : 'help';

const has = (flag) => args.includes(flag);

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function skillsRoot() {
  const dirIndex = args.indexOf('--dir');
  if (dirIndex !== -1) {
    const value = args[dirIndex + 1];
    if (!value || value.startsWith('-')) fail('--dir needs a path.');
    return path.resolve(value);
  }
  if (has('--global')) return path.join(os.homedir(), '.claude', 'skills');
  return path.join(process.cwd(), '.claude', 'skills');
}

function help() {
  console.log(`generate-playwright-tests-skill

Usage:
  npx generate-playwright-tests-skill install [options]
  npx generate-playwright-tests-skill uninstall [options]

Options:
  --global      Use ~/.claude/skills (all projects)
  --dir <path>  Use a custom skills folder (other agents)
  --force       Overwrite an existing install

Default target: ./.claude/skills/${SKILL}`);
}

function sameSkill(dest) {
  try {
    const a = fs.readFileSync(path.join(source, 'SKILL.md'), 'utf8');
    const b = fs.readFileSync(path.join(dest, 'SKILL.md'), 'utf8');
    return a === b;
  } catch {
    return false;
  }
}

function install() {
  const dest = path.join(skillsRoot(), SKILL);
  if (fs.existsSync(dest) && !has('--force')) {
    if (sameSkill(dest)) {
      console.log(`Already up to date at ${dest}`);
      return;
    }
    fail(`${dest} already exists. Use --force to overwrite.`);
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(source, dest, { recursive: true, force: true });
  console.log(`Installed skill to ${dest}`);
  console.log('This skill also needs the playwright-cli skill to explore the live site.');
}

function uninstall() {
  const dest = path.join(skillsRoot(), SKILL);
  if (!fs.existsSync(dest)) fail(`Nothing to remove at ${dest}.`);
  fs.rmSync(dest, { recursive: true, force: true });
  console.log(`Removed ${dest}`);
}

// Runs automatically after `npm install`. Copies the skill out of node_modules
// into the skills folder. Never fails the npm install.
function postinstall() {
  try {
    const isGlobal = process.env.npm_config_global === 'true';
    const projectDir = process.env.INIT_CWD;
    const packageRoot = path.resolve(__dirname, '..');
    if (!isGlobal && (!projectDir || path.resolve(projectDir) === packageRoot)) return;
    const root = isGlobal
      ? path.join(os.homedir(), '.claude', 'skills')
      : path.join(projectDir, '.claude', 'skills');
    const dest = path.join(root, SKILL);
    fs.mkdirSync(root, { recursive: true });
    fs.cpSync(source, dest, { recursive: true, force: true });
    console.log(`[${SKILL}] skill installed to ${dest}`);
  } catch (error) {
    console.warn(`[${SKILL}] could not copy the skill: ${error.message}`);
    console.warn(`Run: npx generate-playwright-tests-skill install`);
  }
}

switch (command) {
  case 'postinstall':
    postinstall();
    break;
  case 'install':
    install();
    break;
  case 'uninstall':
    uninstall();
    break;
  default:
    help();
}
