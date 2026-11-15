---
name: generate-playwright-tests
description: Generate, update, and fix Playwright TypeScript UI tests using the Page Object Model, explored on the live site via playwright-cli, with API calls allowed for setup and teardown data only. Use whenever the user asks to write, convert, extend, debug, or review Playwright tests, page objects, fixtures, or test data, including requests like "automate this flow" or "write a script for this page".
---

# Playwright Tests (TypeScript, POM)

These rules are mandatory unless the user explicitly overrides one.

## Scope

- UI tests only. API calls are allowed for setup and teardown data only (see API setup). The behavior under test is always driven and asserted through the UI.
- Page Object Model only. No BDD libraries.
- TypeScript strict mode. Never use `any`.
- Never guess page structure or data. Explore the live site with the **playwright-cli** skill. If it is not installed, tell the user and stop.

## Workflow

Do not write test code before steps 1 and 2 are done.

1. **Clarify.** Identify the feature, pages, expected result, and which setup and teardown data needs an API call. Ask if anything is ambiguous.
2. **Explore.** Run `open`, then `snapshot`, then interact. Re-snapshot after every navigation or DOM change, because refs go stale. Note which elements expose a `data-testid`.
3. **Page objects.** Check `pages/` first, then reuse or extend. Never duplicate.
4. **Write tests** using page objects, fixtures, and the test data supplied in the prompt. Add API helpers only where setup or teardown data is needed.
5. **Verify.** Run `LANGUAGE=en npx playwright test <file>` and `LANGUAGE=ar npx playwright test <file>` separately. On failure, re-inspect the element with playwright-cli before changing the locator. Stop after 3 failed fix attempts and report the cause.
6. **Report** using the Definition of Done and the final report format below. If a failure may indicate an application defect, use the companion [bug-reporting skill](../bug-reporting/SKILL.md) to triage it and preserve evidence for confirmed defects. A failing test alone is not a confirmed defect.

Exploration rules:
- Refs (`e12`) drive the browser only and never appear in code. Derive locators from test ids, roles, and accessible names in the snapshot.
- Treat generated test code as a draft of steps only. Rewrite it into the project structure.
- No destructive actions (payments, deletions) without user approval.
- Save screenshots and snapshots to `output/playwright/` and do not commit them.

## Structure

```
tests/               <feature>.spec.ts, one per feature
pages/               <Name>Page.ts, one class per page
pages/components/    shared UI (header, modal, table)
fixtures/            pages.ts, labels.ts
test-data/           *.json + typed loader (index.ts)
api/                 typed API clients for setup and teardown data only
utils/               helpers (getLanguage, unique values, dates)
auth/                storage state (git-ignored)
bug-reports/         confirmed defect reports and evidence (bug-reporting skill)
```

Do not create other top-level folders. Test titles follow `should <result> when <condition>`.

## Locators

Priority, use the first one that is stable and unique:

1. `getByTestId` (`data-testid`)
2. `getByRole` with an accessible name
3. `getByLabel`
4. `getByPlaceholder`
5. `getByText` (static, unique text only)
6. Short CSS
7. XPath (commented, last resort)

Rules:
- Configure the attribute once in `playwright.config.ts` with `use: { testIdAttribute: 'data-testid' }`. Use the attribute the app actually exposes, found during exploration.
- Test ids are language-independent, so prefer them for elements whose text changes between `en` and `ar`.
- Never invent a test id. Use only ids seen in the live snapshot or DOM.
- If an interactive element has no test id and the fallback is weaker than `getByRole`, add `// TODO: needs data-testid` and list it in the report.
- Never use `nth()`, `first()`, or `last()` to resolve ambiguity, and never use generated classes or long CSS/XPath chains.

## Page objects

- Define every static locator as a `readonly` property initialized in the constructor.
- Parameter-dependent elements are methods that return a `Locator`.
- Scope child locators from a container locator.
- No inline locators in specs. Shared UI goes in `components/`.
- Page objects expose three kinds of members:
  - **Locators**: `readonly` properties and locator-returning methods.
  - **Actions**: `async` methods that perform user behavior, such as `login()` or `search()`.
  - **Assertions**: `async` methods named `expect<Something>` that contain the web-first `expect` calls.
- Assertion methods:
  - Take the expected value as a parameter. Values come from `test-data/` or `fixtures/labels.ts`, never literals.
  - Return `Promise<void>`, check one thing, and contain no actions.
  - Are the only place `expect` is imported in a page object.
- Page objects never call `test.step`. All steps live in spec files.

```ts
import { expect, type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(readonly page: Page) {
    this.emailInput = page.getByTestId('login-email');
    this.passwordInput = page.getByTestId('login-password');
    this.submitButton = page.getByRole('button', { name: 'Sign in' });
    this.errorMessage = page.getByTestId('login-error');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectErrorMessage(text: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toHaveText(text);
  }

  card(name: string): Locator {
    return this.page.getByRole('article').filter({ hasText: name });
  }
}
```

## UI language

- `LANGUAGE=en|ar`, default `en`. Reuse `getLanguage()` or add a typed helper in `utils/`.
- Set `LANGUAGE` before Playwright starts. Never change it inside a test or loop over languages in one process.
- Keep translated UI text in `fixtures/labels.ts` as `{ en, ar }`, captured from the live site, and select it with `[lang]`.
- Switch language in `beforeEach` through a reusable `changeLanguage(page)`. Wait for the translated title and for the menu to close, using condition-based waits.

```ts
export const labels = {
  pageTitle: { en: 'Dashboard Overview', ar: 'نظرة عامة على لوحة التحكم' },
};
```

## Test data

- Test data is supplied by the user in the prompt. Do not capture, generate, or guess business data from the site.
- Keep supplied business and reference data in `test-data/` and read it through a typed loader. Specs never read raw JSON.
- Never put literal business values or translated text in specs or page objects.
- Generate user-entered values at runtime with a unique suffix. Compute dates relative to today.
- Never store real customer data, passwords, tokens, or payment details. Credentials come from `.env`.
- If required data is missing or does not match the site, ask the user. Do not substitute guesses.
- Avoid tests that permanently modify shared data. If unavoidable, state the side effect at the top of the test.

## API setup

API calls are allowed only to create the data a test needs before the UI flow starts (setup) and to remove the data that test created afterward (teardown).

- Put API calls in typed client classes under `api/`, one per domain, using Playwright's `request` context. Expose them through a fixture, like page objects.
- Use `baseURL` and credentials from config and `.env`. Never hardcode URLs, tokens, or credentials.
- Send payloads built from `test-data/` plus runtime unique values. Return the created values so the test can use them in the UI.
- Check the response status inside the client and fail with a clear message. No `try/catch` that hides failures.
- Call API setup from `beforeEach` in the spec, inside a `test.step` such as `Create a booking through the API`.
- Teardown runs from `afterEach` in the spec, inside a `test.step` such as `Delete the booking through the API`. It removes only the data that test created, using the ids returned by setup, and never touches shared or pre-existing data.
- Teardown must fail with a clear message if the cleanup call fails. No `try/catch` that hides it.
- Never use the API to perform or verify the behavior under test. That goes through the UI and is asserted by page-object assertions.
- Login still goes through the UI `setup` project that saves storage state.

## Test design

- Independent, single-behavior tests grouped with `test.describe`.
- Tag with `@smoke` or `@regression`. Navigate in `beforeEach`.
- Inject page objects through fixtures. Specs import `test` from `fixtures/pages`.
- Specs contain no `expect(...)` calls and no locators. They read as a sequence of page-object actions and assertion calls.
- Auth: log in once in a `setup` project, save `auth/<role>.json`, and reuse it via `storageState` and `dependencies`. Login-page tests start with empty state.
- Use `baseURL` and relative paths.

### Steps

Use `test.step` to make tests readable and failures easy to locate.

- `test.step` is used in spec files only, never in page objects, fixtures, or API clients.
- Every test is split into `test.step()` blocks for its major stages, usually Arrange, Act, and Assert.
- Step names describe the business intent in plain language, for example `Search for an available space`, not `click button`.
- Call shared helpers, such as `changeLanguage`, and API setup and teardown inside a step in `beforeEach` and `afterEach`.
- Do not wrap a single trivial call in its own step, and do not nest steps more than 2 levels deep.
- Each step calls one or more page-object actions or assertion methods, so the report reads as the test scenario.
- Return values from a step when later stages need them.

```ts
import { test } from '../fixtures/pages';
import { labels } from '../fixtures/labels';
import { getLanguage } from '../utils/getLanguage';
import { loginData } from '../test-data';

const lang = getLanguage();

test.describe('Login', () => {
  test('should show an error when the password is wrong @regression', async ({ loginPage }) => {
    await test.step('Open the login page', async () => {
      await loginPage.goto();
    });

    await test.step('Submit invalid credentials', async () => {
      await loginPage.login(loginData.validEmail, loginData.invalidPassword);
    });

    await test.step('Verify the error is shown', async () => {
      await loginPage.expectErrorMessage(labels.invalidCredentials[lang]);
    });
  });
});
```

```ts
export const test = base.extend<{ loginPage: LoginPage }>({
  loginPage: async ({ page }, use) => { await use(new LoginPage(page)); },
});
export { expect } from '@playwright/test';
```

## Assertions and waiting

- Use web-first assertions only (`toBeVisible`, `toHaveText`, `toHaveURL`, `toHaveCount`).
- Assertions live in page-object `expect<Something>` methods. Specs call those methods and never call `expect` directly.
- Wait on conditions, never on time. Await every Playwright call.

## Never

`waitForTimeout` · `networkidle` as a general wait · `force: true` · `try/catch` hiding failures · `page.$()` / `page.$$()` · committed `test.only` / `test.skip` · locators in specs · `expect(...)` in specs · literal business data in specs or page objects · hardcoded credentials or URLs · API calls to perform or verify the behavior under test · `test.step` outside spec files · `any` · copied page objects · invented test ids · steps named after raw clicks

## Definition of Done

- [ ] Site explored with playwright-cli, and no refs in code
- [ ] Test data comes from the prompt, kept in `test-data/`, and read through the typed loader
- [ ] API calls exist only for setup and teardown data, live in `api/` clients, and are never used to verify the behavior under test
- [ ] Locators follow the priority order, starting with `getByTestId`, and no test id was invented
- [ ] Static locators are `readonly` and initialized in constructors
- [ ] No inline locators, hard waits, `networkidle`, or `force: true`
- [ ] Assertions are web-first and live in page-object `expect<Something>` methods, with none in specs
- [ ] Specs group each test, `beforeEach`, and `afterEach` work into named `test.step` blocks, and page objects contain no `test.step`
- [ ] Page objects are injected via fixtures
- [ ] No hardcoded business values, dates, or credentials
- [ ] Labels are `{ en, ar }` selected with `[lang]`
- [ ] Passes twice in each language, run separately: `LANGUAGE=<en|ar> npx playwright test <file> --repeat-each=2`
- [ ] `npx tsc --noEmit` passes
- [ ] Files are in the correct folders and follow the naming rules

## Ask instead of guessing when

The requirement is unclear, the flow needs credentials or data the site cannot provide, site data looks inconsistent, or a locator cannot be made stable without app changes.

## Final report

1. Files created or changed
2. Test data used and API setup and teardown calls added
3. Assumptions
4. Elements needing `data-testid`
5. Test result and the command used
