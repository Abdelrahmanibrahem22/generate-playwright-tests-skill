#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const SKILLS = ['generate-playwright-tests', 'bug-reporting'];
const sourceRoot = path.join(__dirname, '..', 'skills');
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
  npx github:Abdelrahmanibrahem22/generate-playwright-tests-skill install [options]
  npx github:Abdelrahmanibrahem22/generate-playwright-tests-skill uninstall [options]

Options:
  --global      Use ~/.claude/skills (all projects)
  --dir <path>  Use a custom skills folder (other agents)
  --force       Overwrite an existing install

Installs or removes both skills:
  ${SKILLS.join('\n  ')}

Default target: ./.claude/skills/<skill-name>`);
}

function sameSkill(skill, dest) {
  try {
    const a = fs.readFileSync(path.join(sourceRoot, skill, 'SKILL.md'), 'utf8');
    const b = fs.readFileSync(path.join(dest, 'SKILL.md'), 'utf8');
    return a === b;
  } catch {
    return false;
  }
}

function install() {
  const root = skillsRoot();
  // Check all destinations before copying so a conflict leaves both untouched.
  for (const skill of SKILLS) {
    const dest = path.join(root, skill);
    if (fs.existsSync(dest) && !has('--force') && !sameSkill(skill, dest)) {
      fail(`${dest} already exists. Use --force to overwrite.`);
    }
  }
  for (const skill of SKILLS) {
    const dest = path.join(root, skill);
    if (fs.existsSync(dest) && !has('--force')) {
      console.log(`Already up to date at ${dest}`);
      continue;
    }
    fs.mkdirSync(root, { recursive: true });
    fs.cpSync(path.join(sourceRoot, skill), dest, { recursive: true, force: true });
    console.log(`Installed skill to ${dest}`);
  }
  console.log('These skills also need the playwright-cli skill to explore and inspect the live site.');
}

function uninstall() {
  const root = skillsRoot();
  let removed = false;
  for (const skill of SKILLS) {
    const dest = path.join(root, skill);
    if (!fs.existsSync(dest)) continue;
    fs.rmSync(dest, { recursive: true, force: true });
    console.log(`Removed ${dest}`);
    removed = true;
  }
  if (!removed) fail(`Nothing to remove at ${root}.`);
}

// Runs automatically after `npm install`. Copies the skills out of node_modules
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
    fs.mkdirSync(root, { recursive: true });
    for (const skill of SKILLS) {
      const dest = path.join(root, skill);
      fs.cpSync(path.join(sourceRoot, skill), dest, { recursive: true, force: true });
      console.log(`[${skill}] skill installed to ${dest}`);
    }
  } catch (error) {
    console.warn(`[generate-playwright-tests-skill] could not copy the skills: ${error.message}`);
    console.warn(`Run: npx github:Abdelrahmanibrahem22/generate-playwright-tests-skill install`);
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
