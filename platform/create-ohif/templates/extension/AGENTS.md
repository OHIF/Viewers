# AGENTS.md — {{name}} (OHIF extension)

## What this package is

An OHIF v3 extension built as a UMD bundle (plugin Contract v1). The default export of
`src/index.tsx` is the extension object; its `id` MUST equal package.json `name`. The deployable
artifact is `dist/index.umd.js` (the extension's CSS is injected by that bundle at runtime).

## Commands

- `pnpm dev` — watch build (development UMD to `dist/`)
- `pnpm build` — production UMD to `dist/`
- `pnpm test` — headless contract smoke test (`src/__tests__/extension.test.ts`)
- `pnpm typecheck` — `tsc --noEmit`

## Hard rules (violating any breaks loading in the host)

1. `src/id.ts` derives `id` from package.json `name`. Never hardcode a different id.
2. Every module entry needs a `name` (the host throws otherwise). The module id becomes
   `<id>.<moduleType>.<name>`.
3. Never bundle or import copies of: `react`, `react-dom`, `react/jsx-runtime`, `@ohif/*`,
   `@cornerstonejs/*`, `dcmjs`, `gl-matrix`, `vtk.js`. They are externals
   (see `.rspack/pluginExternals.js`); the host provides all of them as runtime
   globals EXCEPT `vtk.js`, which is externalized with no host global — a known v1
   gap. A runtime-loaded plugin that imports `vtk.js` resolves it to `undefined`
   at load and breaks, so do not depend on `vtk.js` in a runtime extension.
4. Never import `@ohif/ui` — it is legacy and the host does not provide it to runtime plugins.
   Use `@ohif/ui-next`.
5. Do not edit `output.library` / `externals` in `.rspack/` — that is the host contract.
6. Keep `keywords: ["ohif-extension"]` and the `@ohif/core` peerDependency range accurate — the
   host refuses to load on range mismatch.
7. Keep package.json `module` pointing at `src/index.tsx` — directory-mode loading
   (pluginConfig `directory`) resolves the package through that field.
8. CSS is injected at runtime by the bundle (style-loader), self-contained (Tailwind scans only
   this package; preflight stays off). Never rely on host stylesheets.
9. Publish with `pnpm publish` (publishConfig field rewrites do not work with the npm CLI).

## Module map

| File                              | Module type           | Registered id                              |
| --------------------------------- | --------------------- | ------------------------------------------ |
| src/getViewportModule.tsx         | viewportModule        | `{{name}}.viewportModule.example`          |
| src/getPanelModule.tsx            | panelModule           | `{{name}}.panelModule.examplePanel`        |
| src/commandsModule.ts             | commandsModule        | commands in context `DEFAULT`              |
| src/getSopClassHandlerModule.ts   | sopClassHandlerModule | `{{name}}.sopClassHandlerModule.example`   |
| src/getToolbarModule.tsx          | toolbarModule         | `{{name}}.toolbarModule.evaluate.*`        |
| src/getHangingProtocolModule.ts   | hangingProtocolModule | `{{name}}.hangingProtocolModule.example`   |

(Only the module types selected at scaffold time exist in this checkout.)

## Adding functionality

- Command: add to `definitions` in `src/commandsModule.ts` (defaultContext `DEFAULT`).
- Panel: `{ name, iconName, iconLabel, label, component }` in `src/getPanelModule.tsx`.
- Viewport: `{ name, component }` in `src/getViewportModule.tsx`.
- Hanging protocol: `{ name, protocol }` in `src/getHangingProtocolModule.ts` (auto-registered
  with the HangingProtocolService when `protocol` is present).
- Another module type: create `src/get<Type>Module.ts(x)` with a default-exported getter and add
  it as a property of the object in `src/index.tsx`.

## Services

Access via `servicesManager.services` (destructure by name). Subscribe via
`service.subscribe(EVENT, cb)` and unsubscribe on cleanup; prefer pub-sub over polling effects.

## Testing

`pnpm test` runs the headless harness (`src/__tests__/harness.ts` — mock managers mirroring the
host's registration contract, no browser, no `@ohif/core` install). Rendering cannot be tested
here — see docs 'Building OHIF extensions with an agent' → Testing for the viewer-in-docker +
Playwright flow.

## Reference

- Contract: https://docs.ohif.org/platform/extensions/building-with-agents
- Reference implementation: https://github.com/OHIF/extension-example
