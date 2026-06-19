# TODO before merge

Temporary / dev-only changes added while building the native GenericViewport
("next") migration behind `appConfig.useNextViewports`. Remove or revert all of
these before merging to `master`. They exist only to make the native path easy
to exercise and compare locally; none of them should ship.

## 1. Dev config flag (flips the default for everyone)
- `platform/app/public/config/default.js` — remove the `useNextViewports: true`
  line. The flag must stay opt-in (default off); committing it on would change
  the default backend for every deployment using this config.

## 2. In-toolbar legacy/next backend toggle button (debug only)
A throwaway toolbar button + supporting plumbing to flip the backend at runtime
and reload. Remove all of:
- `extensions/cornerstone/src/utils/nextViewports.ts` — remove
  `resolveNextViewportsEnabled`, `toggleNextViewportsAndReload`, and the
  `NEXT_VIEWPORTS_OVERRIDE_KEY` localStorage block. Keep
  `set/isNextViewportsEnabled`.
- `extensions/cornerstone/src/init.tsx` — revert to
  `setNextViewportsEnabled(Boolean(appConfig.useNextViewports));` (drop the
  `resolveNextViewportsEnabled` override and its import).
- `extensions/cornerstone/src/commandsModule.ts` — remove the
  `toggleNextViewports` action, its entry in the commands map, and the
  `toggleNextViewportsAndReload` import.
- `extensions/cornerstone/src/getToolbarModule.tsx` — remove the
  `evaluate.cornerstone.nextViewportsToggle` evaluator and the
  `isNextViewportsEnabled` import. Then also drop `getToolbarModule.tsx` from the
  allowlist in `.scripts/check-next-viewports-flag-reads.mjs` (it is the one
  TEMP-only entry there).
- `modes/basic/src/toolbarButtons.ts` — remove the `ToggleNextViewport` button.
- `modes/basic/src/index.tsx` — remove `'ToggleNextViewport'` from the primary
  toolbar section.

Each temporary block is marked with a `TEMP (remove before merge ...)` comment,
so `git grep "remove before merge"` finds every site.

## 3. Flag-read allowlist guard (permanent — keep)

`yarn next:check-flag-reads` (`.scripts/check-next-viewports-flag-reads.mjs`)
enforces migration plan §4.2: the `useNextViewports` flag may be read only in the
sanctioned set — `getCornerstoneViewportType.ts` (type selection),
`CornerstoneViewportService.ts` (backend selection), `nextViewports.ts` (the
accessor), `init.tsx` (the one `appConfig.useNextViewports` read that seeds the
accessor), and — temporarily — `getToolbarModule.tsx` (the dev toggle). Everywhere
else, branch on cornerstone content/capability predicates or the Legacy/Next
backend twins. This guard is NOT a dev-only revert; it stays after merge.

## 4. Verify
After removing the above:
- `git grep "remove before merge"` returns nothing.
- `git grep useNextViewports -- platform/app/public/config` returns nothing.
- `yarn next:check-flag-reads` still passes (with `getToolbarModule.tsx` dropped
  from its allowlist).
- The native path is still reachable purely by setting `useNextViewports: true`
  in a deployment config (the feature itself stays).
