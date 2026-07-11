# AGENTS.md — {{name}} (OHIF mode)

## What this package is

An OHIF v3 mode (a viewer workflow) built as a UMD bundle (plugin Contract v1). The default
export of `src/index.ts` is the mode object `{ id, modeFactory, extensionDependencies }`; its
`id` MUST equal package.json `name`. The deployable artifact is `dist/index.umd.js` (modes ship
no CSS — components come from extensions).

## Commands

- `pnpm dev` — watch build (development UMD to `dist/`)
- `pnpm build` — production UMD to `dist/`
- `pnpm test` — headless contract smoke test (`src/__tests__/mode.test.ts`)
- `pnpm typecheck` — `tsc --noEmit`

## Hard rules (violating any breaks loading in the host)

1. `src/id.ts` derives `id` from package.json `name`. Never hardcode a different id.
2. Never bundle or import copies of: `react`, `react-dom`, `react/jsx-runtime`, `@ohif/*`,
   `@cornerstonejs/*`, `dcmjs`, `gl-matrix`, `vtk.js`. They are externals
   (see `.rspack/pluginExternals.js`); the host provides them.
3. Never import `@ohif/ui` — it is legacy and the host does not provide it to runtime plugins.
   Use `@ohif/ui-next`.
4. Do not edit `output.library` / `externals` in `.rspack/` — that is the host contract.
5. Keep `keywords: ["ohif-mode"]` and the `@ohif/core` peerDependency range accurate — the host
   refuses to load on range mismatch.
6. Keep package.json `module` pointing at `src/index.ts` — directory-mode loading
   (pluginConfig `directory`) resolves the package through that field.
7. Every extension listed in `extensionDependencies` must be present in the host (bundled into
   the viewer or itself loaded as a runtime extension); the host validates them before the mode
   becomes routable. Every namespaced id the mode references
   (`<extensionId>.<moduleType>.<name>`) must come from one of those extensions.
8. Publish with `pnpm publish` (publishConfig field rewrites do not work with the npm CLI).

## Anatomy

| File                          | Role                                                            |
| ----------------------------- | --------------------------------------------------------------- |
| src/index.ts                  | mode object + `modeFactory` (routes, lifecycle, tool bindings)  |
| src/id.ts                     | id derived from package.json name (contract by construction)    |
| src/toolbarButtons.ts         | toolbar button definitions registered in `onModeEnter`          |
| src/__tests__/mode.test.ts    | headless contract smoke test                                     |

`modeFactory` returns: `routeName` (URL segment), `displayName`, `onModeEnter`/`onModeExit`
(set up and tear down tool groups + toolbar), `isValidMode` (offered per study),
`routes[].layoutTemplate` (layout module id + panel/viewport namespaces), `extensions`,
`hangingProtocol`, `sopClassHandlers` (which display sets the mode shows).

## Adding functionality

- Another panel/viewport: reference its namespaced id in `layoutTemplate` props and make sure
  the owning extension is in `extensionDependencies`.
- Another tool: add its binding in `onModeEnter`, a button in `src/toolbarButtons.ts`, and list
  the button id in `toolbarService.updateSection`.
- Strings are plain string literals on purpose — do not add an `i18next` import; a standalone
  mode must not depend on host-internal i18n wiring.

## Testing

`pnpm test` runs a headless vitest smoke test against the mode object (no browser, no
`@ohif/core` install). Rendering cannot be tested here — see docs 'Building OHIF extensions
with an agent' → Testing for the viewer-in-docker + Playwright flow.

## Reference

- Contract: https://docs.ohif.org/platform/extensions/building-with-agents
- Reference implementation: https://github.com/OHIF/extension-example
