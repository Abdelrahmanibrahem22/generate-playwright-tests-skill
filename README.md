# generate-playwright-tests-skill

An agent skill that makes an AI coding agent write Playwright TypeScript UI tests in a consistent, structured way.

## What it enforces

- Page Object Model only, TypeScript strict mode, no BDD library
- Locator priority: `getByTestId`, then `getByRole`, `getByLabel`, `getByPlaceholder`, `getByText`, short CSS, XPath last
- Assertions live in page-object `expect<Something>` methods, and specs only call them
- `test.step` is used in spec files only, to keep tests readable and failures easy to locate
- API calls allowed for setup and teardown data only, UI for everything under test
- English and Arabic runs, selected with `LANGUAGE=en|ar`
- Web-first assertions, no hard waits, no `force: true`

## Requirements

- Node.js 18 or later
- The `playwright-cli` skill installed in your agent, because this skill explores the live site with it
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

Add `--force` to overwrite an existing install. To remove it:

```bash
npx generate-playwright-tests-skill uninstall
```

The skill is copied to `.claude/skills/generate-playwright-tests/SKILL.md`.

## Use

Ask your agent, for example: "Automate the login flow" or "Write Playwright tests for the booking page". Supply the test data in your prompt, because the skill does not generate business data.

## Contributing

Issues and pull requests are welcome. Keep the skill short and keep its rules testable.

## License

MIT
