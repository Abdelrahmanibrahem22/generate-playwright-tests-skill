---
name: bug-reporting
description: Write a professional, standardized bug report with screenshot and video evidence after a Playwright test failure has been triaged and confirmed as an application defect. Use when asked to write or file a bug report, or to report defects found by tests. Do not use while the failure may still be a test, locator, data, or environment problem.
---

# Skill: Professional Bug Reporting & Evidence Capture (Playwright)

## 1. Objective

When a Playwright test run exposes a confirmed bug, UI issue, functional
issue, or unexpected behavior in the application, generate a
professional, concise, and standardized bug report.

The report must clearly describe the issue, reproduction steps, expected
behavior, actual behavior, and supporting evidence.

## 2. Triage Before Reporting

A failing test is not automatically a bug. Do not write a report until
the failure is confirmed as an application defect.

1.  Re-run the failing test once to rule out a one-off failure.
2.  Re-inspect the failing element with playwright-cli. If the locator is
    stale or wrong, fix the test and do not report a bug.
3.  Check that the test data and the environment are valid and match the
    requirements.
4.  Compare the observed behavior with the requirements or acceptance
    criteria.

Then decide:

-   **Test issue** (locator, data, wait, setup): fix the test following
    the [generate-playwright-tests skill](../generate-playwright-tests/SKILL.md).
    Do not create a bug report.
-   **Cannot be reproduced or verified:** state that clearly. Do not
    present it as a confirmed defect.
-   **Confirmed application defect:** continue with this skill.

## 3. Standard Bug Report Template

Use the following template for every confirmed issue:

### **Title:**

-   Write a short, clear, and descriptive title.
-   Identify the affected feature and the observed problem.
-   Avoid vague titles such as "Something is wrong" or "Page error".

### **Environment:**

-   Specify the application URL, build or version, browser, and
    operating system.
-   Take the values from the test configuration and the run. Do not
    guess; write `N/A` for anything unknown.

### **Precondition:**

-   Specify the required user role, account status, permissions, and
    test data.
-   Include any setup or configuration needed before reproducing the
    issue.
-   Write `N/A` if no preconditions are required.

### **Steps:**

1.  Provide clear, numbered steps to reproduce the issue.
2.  Include navigation paths and user actions.
3.  Keep the steps concise, accurate, and reproducible.

### **Expected Result:**

-   Describe the correct behavior based on the requirements or
    acceptance criteria.
-   Do not invent expected behavior when requirements are unclear.

### **Actual Result:**

-   Describe what happened during test execution.
-   Include the exact error message or unexpected response when
    relevant.
-   Report observations only; do not assume the root cause.

### **Screenshot / Video Recording:**

-   Attach a screenshot that clearly shows the issue.
-   Attach the Playwright browser session video when available.
-   Include the evidence file paths or links.
-   Ensure the recording captures the actions leading to the issue and
    the final unexpected behavior.

## 4. Evidence Capture Requirements

Evidence is captured by the Playwright configuration, not by test code.
Do not create browser contexts manually or call `page.screenshot` or
`recordVideo` in specs, because that bypasses the `page` fixture,
`baseURL`, and `storageState`.

Make sure `playwright.config.ts` contains:

``` typescript
use: {
  screenshot: { mode: 'only-on-failure', fullPage: true },
  video: { mode: 'retain-on-failure', size: { width: 1280, height: 720 } },
  trace: 'retain-on-failure',
},
```

Playwright captures the screenshot, video, and trace automatically when
a test fails, and the video is finalized when the test ends. Failed
assertions throw, so evidence is never captured from inside the test
body.

Collect and organize the evidence after the run:

-   Read the failure output and the matching folder under
    `test-results/`, which contains the screenshot, `video.webm`, and
    `trace.zip` for the failed test.
-   Copy the files into the bug folder and rename them to
    `screenshot.png`, `recording.webm`, and `trace.zip`.
-   Organize evidence by bug name: one folder per bug, named with the
    bug name (see naming below).

Reports are saved in `bug-reports/` at the project root, **not** inside
`test-results/`, because Playwright deletes `test-results/` at the start
of every run. Add `bug-reports/` to the project structure.

Name the bug folder and the report file after the bug, not a number:

-   Build the name from the affected feature and the observed problem,
    for example `my-bookings-qr-code-not-displayed`.
-   Use lowercase kebab-case, ASCII characters only, and at most 60
    characters. Write Arabic UI labels in English.
-   The folder and the Markdown file share the same name.
-   If a folder with that name already exists, check whether it is the
    same issue (rule 4). If it is, do not create a new report. If it is
    a different issue, add a distinguishing detail to the name.

Suggested folder structure:

``` text
bug-reports/
  my-bookings-qr-code-not-displayed/
    my-bookings-qr-code-not-displayed.md
    screenshot.png
    recording.webm
    trace.zip
  search-results-wrong-count-after-filter/
    search-results-wrong-count-after-filter.md
    screenshot.png
    recording.webm
    trace.zip
```

## 5. Bug Reporting Rules

1.  Report only issues observed during test execution and confirmed by
    triage.
2.  Use requirements and acceptance criteria to determine expected
    behavior.
3.  Keep reports brief, professional, and easy to understand.
4.  Avoid duplicate reports for the same issue.
5.  Create separate reports for unrelated issues.
6.  Include relevant error messages and evidence when available.
7.  Never expose passwords, authentication tokens, personal data, or
    other secrets in reports or recordings.
8.  Do not classify an issue as Frontend or Backend without sufficient
    evidence.
9.  If the issue cannot be reproduced or verified, clearly state that
    rather than presenting it as a confirmed defect.
10. Do not stop the entire test suite unless the test framework or test
    strategy requires it.

## 6. Expected Output

For each confirmed issue, generate a Markdown bug report using this
structure:

``` markdown
# [BUG TITLE]

#### **Environment:**
- URL: [application URL]
- Build / version: [build or version]
- Browser: [browser and version]
- OS: [operating system]

#### **Precondition:**
- [Required setup, user role, account, or test data]

#### **Steps:**
1. [First action]
2. [Second action]
3. [Action that reproduces the issue]

#### **Expected Result:**
- [Expected behavior]

#### **Actual Result:**
- [Observed behavior]

#### **Screenshot / Video Recording:**
- Screenshot: [evidence path or link]
- Video: [evidence path or link]
```

If no issue is confirmed, do not create a bug report. Continue test
execution and preserve the normal test results.

## 7. Recommended Workflow

1.  Execute the Playwright test scenario with evidence capture enabled
    in the config.
2.  When a test fails, triage it (section 2).
3.  If the failure is a confirmed application defect, collect the
    screenshot, video, and trace from `test-results/` into
    `bug-reports/<bug-name>/`.
4.  Generate a concise report using the standard template.
5.  Save the Markdown report with its supporting evidence.
6.  Keep the test result and evidence linked to the relevant test and
    bug name.

**Quality standard:** Every report must be clear, reproducible,
evidence-based, and ready to copy into Jira, Azure DevOps, or another
defect-tracking system.
