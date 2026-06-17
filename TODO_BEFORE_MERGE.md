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
  `isNextViewportsEnabled` import.
- `modes/basic/src/toolbarButtons.ts` — remove the `ToggleNextViewport` button.
- `modes/basic/src/index.tsx` — remove `'ToggleNextViewport'` from the primary
  toolbar section.

Each temporary block is marked with a `TEMP (remove before merge ...)` comment,
so `git grep "remove before merge"` finds every site.

## 3. Verify
After removing the above:
- `git grep "remove before merge"` returns nothing.
- `git grep useNextViewports -- platform/app/public/config` returns nothing.
- The native path is still reachable purely by setting `useNextViewports: true`
  in a deployment config (the feature itself stays).
