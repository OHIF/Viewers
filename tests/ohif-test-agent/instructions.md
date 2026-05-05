# Installation Instructions

This file explains how to install this skill package into popular agent runtimes.

## Package contents

This folder is expected to contain:

- `SKILL.md` (core behavior rules)
- `AGENTS.md` (runtime entrypoint)
- `references/` (supporting guidance)
- `assets/` (templates)

## Quick validation after install

After installation in any runtime, validate with a small prompt such as:

"Write an OHIF Playwright test for Length tool and include your pre-output self-check."

A correct response should:

1. Import `test`/`expect` from `./utils`
2. Use fixture-injected page objects
3. Use normalized viewport interactions
4. Use a canonical StudyInstanceUID and compatible mode
5. Handle prompt flows when relevant
6. Include static-check notes if execution was not performed

---

## Claude setup (starting point)

1. Locate your Claude skills directory:
   - Common location: `~/.claude/skills/`
2. Copy this folder into that directory:
   - Result should look like: `~/.claude/skills/ohif-test-agent/`
3. Ensure `SKILL.md` is at the root of the copied folder.
4. Restart Claude session (or open a new one) so skills are discovered.
5. Test with a prompt that clearly targets OHIF Playwright E2E behavior.

Notes:

- Claude triggering uses the `name` and `description` frontmatter in `SKILL.md`.
- Keep `references/` and `assets/` alongside `SKILL.md`; links assume this structure.

---

## Codex setup

Point your Codex runtime at `.github/agents/ohif-test-agent/`.

How you do that depends on how your Codex environment discovers agent instructions (a global config, an IDE setting, a project-level entrypoint, etc.). Whatever the mechanism, the entrypoint you want it to read is:

```
.github/agents/ohif-test-agent/AGENTS.md
```

That file is the runtime-facing summary; it pulls in `SKILL.md`, `references/`, and `assets/` from the same folder. Once Codex is configured to load it, issue an OHIF Playwright E2E prompt as a quick smoke test.

Notes:

- `AGENTS.md` is the entrypoint; `SKILL.md` is the detailed behavior rules. Keep both at the package root.
- The package is source-first: it directs Codex to [tests/pages/](../../../tests/pages/) and [tests/utils/](../../../tests/utils/) for the current method surface rather than duplicating it.

---

## Troubleshooting

If generated tests are wrong or flaky:

1. Confirm the runtime loaded this package (not an older skill).
2. Check imports are from `./utils` (not `@playwright/test`).
3. Verify `DOMOverlayPageObject` casing.
4. Verify UID/mode pairing with `references/patterns-by-feature.md`.
5. Use `references/failure-triage.md` to classify failures before changing logic.

If links appear broken:

- Keep the folder layout unchanged.
- Do not move `references/` or `assets/` outside this package.
