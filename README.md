# generate-playwright-tests-skill

A pair of agent skills for writing consistent Playwright TypeScript UI tests and documenting confirmed application defects with evidence.

## Included skills

### generate-playwright-tests

[Skill instructions](skills/generate-playwright-tests/SKILL.md)

- Page Object Model only, TypeScript strict mode, no BDD library
- Locator priority: `getByTestId`, then `getByRole`, `getByLabel`, `getByPlaceholder`, `getByText`, short CSS, XPath last
- Assertions live in page-object `expect<Something>` methods, and specs only call them
- `test.step` is used in spec files only, to keep tests readable and failures easy to locate
- API calls allowed for setup and teardown data only, UI for everything under test
- English and Arabic runs, selected with `LANGUAGE=en|ar`
- Web-first assertions, no hard waits, no `force: true`

### bug-reporting

[Skill instructions](skills/bug-reporting/SKILL.md)

- Triage failed tests before reporting: re-run, inspect locators, check data and environment, and compare behavior with requirements
- Report only confirmed application defects; fix test issues through the test-generation skill
- Standard Markdown reports covering environment, preconditions, steps, expected and actual results, and evidence
- Capture screenshots, videos, and traces through Playwright configuration
- Preserve reports and evidence in `bug-reports/<bug-name>/`, outside the temporary `test-results/` folder
- Avoid duplicate reports and keep secrets and personal data out of reports and recordings

## Requirements

- Node.js 18 or later
- The `playwright-cli` skill installed in your agent, for live-site exploration and failure triage
- An agent that supports `SKILL.md` skills, such as Claude Code

## Install

Into the current project:

```bash
npx generate-playwright-tests-skill install
```

For all your projects:

```bash
npx generate-playwright-tests-skill install --global
```

For another agent, point at its skills folder:

```bash
npx generate-playwright-tests-skill install --dir ./path/to/skills
```

Each install command installs both skills. Existing identical skills are left in place; conflicting copies require `--force`. This also lets an older installation add `bug-reporting` alongside an unchanged test-generation skill.

Add `--force` to update existing skills to this version. To remove both skills:

```bash
npx generate-playwright-tests-skill uninstall
```

By default, the skills are copied to:

```text
.claude/skills/
  generate-playwright-tests/SKILL.md
  bug-reporting/SKILL.md
```

The `--global` and `--dir` options also apply to `uninstall`. Uninstall removes whichever of the two skills are present and leaves other skills untouched.

### Install from GitHub

```bash
npx github:Abdelrahmanibrahem22/generate-playwright-tests-skill install
```

### Install with `npm install`

```bash
npm install -D github:Abdelrahmanibrahem22/generate-playwright-tests-skill
```

A `postinstall` step copies both skills into `.claude/skills/` of your project (or `~/.claude/skills` with `npm install -g`), replacing existing copies. The package itself stays in `node_modules`, and your agent reads the copies in `.claude/skills`. If your package manager blocks install scripts, run the `install` command above instead.

## Use

Ask your agent, for example: "Automate the login flow" or "Write Playwright tests for the booking page". Supply the test data in your prompt, because the skill does not generate business data.

For bug reporting, ask: "Triage this failed Playwright test and write a bug report if it is a confirmed application defect." Supply requirements or acceptance criteria so the agent can verify expected behavior.

The bug-reporting skill uses this evidence configuration in the target project's `playwright.config.ts`:

```ts
use: {
  screenshot: { mode: 'only-on-failure', fullPage: true },
  video: { mode: 'retain-on-failure', size: { width: 1280, height: 720 } },
  trace: 'retain-on-failure',
},
```

Reports and available evidence are saved under `bug-reports/<bug-name>/`, with the Markdown report named `<bug-name>.md`. If triage does not confirm an application defect, no bug report is created.

## Contributing

Issues and pull requests are welcome. Keep the skills focused and their rules testable.

Run the installer checks and inspect the package contents before pushing:

```bash
npm test
npm pack --dry-run
```

## License

MIT
