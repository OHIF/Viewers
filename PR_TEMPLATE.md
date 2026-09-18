# Pull Request Template

## What changed

<!-- Concrete summary of the feature. -->

## Why

<!-- Architectural/product reason. Avoid "because the task says so" as the only explanation. -->

## Not in this PR

<!-- What a reviewer might expect but will not find, and which PR it lands in. -->

## Architecture / decisions

<!--
IDs, protocol, lifecycle, trade-offs, rejected alternatives.
Label claims about OHIF internals: [VERIFIED] (with file:line), [PROPOSED], [UNVERIFIED].
List any docs/scoring-form/IMPLEMENTATION_NOTES.md §10 open item this PR resolved, with the evidence
(and add it to ARCHITECTURE.md §10 Accepted Decisions), or restate that it is still open.
-->

## Verification

### Automated

- [ ] Scoped typecheck — each app/package we added, via its own `tsconfig.json`, **zero errors**
      (a repository-wide `tsc` is not possible on this baseline: ~6,981 pre-existing upstream
      errors and `TS5053`. See `ARCHITECTURE.md` §20. Never report a scoped pass as repo-wide.)
- [ ] Focused unit tests
- [ ] `pnpm run build` (when relevant)
- [ ] `git diff --stat` confirms no unintended OHIF source changes; `AGENTS.md` / `CLAUDE.md` untouched

### Manual

<!-- Exact steps performed with OHIF/host. -->

1.
2.
3.

## Edge cases checked

- [ ] iframe/viewer not ready yet
- [ ] cancellation
- [ ] stale/duplicate message
- [ ] wrong origin/source
- [ ] cleanup/reload (no duplicated listeners or subscriptions)
- [ ] unrelated OHIF measurement (when relevant)
- [ ] tool activation actually took effect, confirmed by read-back (when relevant)
- [ ] `EllipticalROI` deactivated and `WindowLevel` restored (when relevant)

## Documentation

- [ ] `ARCHITECTURE.md` still matches behavior; any contract change landed in **this** PR
- [ ] Open items updated: resolved ones moved into `ARCHITECTURE.md` §10 with evidence, the rest still listed in `ARCHITECTURE.md` §11 / `docs/scoring-form/IMPLEMENTATION_NOTES.md` §10
- [ ] `AI-USAGE.md` updated if AI was used
- [ ] README updated if startup/config changed
      (install step is `pnpm run install:update-lockfile`, and `pnpm-lock.yaml` is committed,
      whenever workspace dependencies change)

## Known limitations / follow-ups

<!-- Explicitly list deferred star tasks or production hardening. -->
