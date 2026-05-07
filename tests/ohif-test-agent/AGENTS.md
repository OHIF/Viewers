# OHIF Test Agent (AgentSkills Wrapper)

Use this guide whenever the user asks to write, add, modify, review, or debug Playwright E2E tests for OHIF Viewer workflows.

This wrapper is for any runtime that supports agentskills.io. The technical rules are shared with `SKILL.md`.

## Required workflow

1. Classify the requested test by feature area.
2. Read `references/patterns-by-feature.md` and choose a seed spec.
3. Scaffold from `assets/spec-template.ts` or adapt the seed spec.
4. Confirm fixture and import conventions from:
   - `references/page-objects.md`
   - `references/utilities.md`
5. For method signatures, read source under `tests/pages/` and `tests/utils/`.
6. Generate test code.
7. If execution is available, run Playwright for that spec and adjust.
8. If execution is unavailable, run static validation and report limits.

## Hard rules

- Import `test` and `expect` from `./utils`, never from `@playwright/test`.
- Use fixture-injected page objects from test args. Do not instantiate page objects with `new`.
- Use normalized viewport interactions for WebGL (`normalizedClickAt`, `normalizedDragAt`).
- Use canonical StudyInstanceUID values and valid mode pairing.
- Handle segmentation hydration and measurement tracking prompts when applicable.
- Use screenshot comparison for canvas-rendered assertions and DOM assertions for panel/dialog/overlay text state.
- If a utility is not exported from `./utils`, use deep import from `./utils/<file>`.

## Mandatory self-check before final answer

Confirm all of these are true:

1. Correct import source (`./utils`).
2. Correct fixture key casing (`DOMOverlayPageObject` with capital D).
3. Normalized viewport interactions used by default.
4. UID and mode are compatible with the tested feature.
5. Prompt dialogs/hydration flow are handled if triggered by that scenario.
6. Assertion strategy matches render surface (canvas vs DOM).

## Output contract when tests are not executed

If you cannot run tests in this environment, include:

1. The generated test code.
2. Assumptions made.
3. Static checks performed.
4. Exact local commands to run, such as:

```sh
yarn playwright test tests/<SpecName>.spec.ts
yarn playwright test tests/<SpecName>.spec.ts --update-snapshots
```

## Reference map

- Feature seeds and canonical UIDs: `references/patterns-by-feature.md`
- Page object structural rules: `references/page-objects.md`
- Utility import/signature rules: `references/utilities.md`
- Failure diagnosis patterns: `references/failure-triage.md`
