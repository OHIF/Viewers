---
sidebar_position: 8
sidebar_label: Building with an Agent
title: Building OHIF extensions with an agent
summary: Normative contract for authoring an OHIF v3 extension — the default-export object, the id === package name rule, module getter signatures, the name-required rule, the UMD build/externals contract, package.json fields, build-time and runtime installation, the canonical AGENTS.md, the headless smoke harness, and a failure-mode table for agents.
---

# Building OHIF extensions with an agent

This page is normative. It states the extension contract precisely so an agent
can author, build, and install an OHIF v3 extension without reading the host
source. It is emitted into the docs `llms.txt` / `llms-full.txt` bundle, so an
agent may ingest it directly. Every rule below is enforced by the host at
registration or load time; violating one produces the errors in the
[Failure modes](#failure-modes-for-agents) table.

## Ground truth

Run `pnpm create ohif@beta` and treat its output as the canonical
implementation of everything below. The always-green reference is
[https://github.com/OHIF/extension-example](https://github.com/OHIF/extension-example).

When this page and generated code disagree, the scaffolder output wins — it is
built and tested against the current host; this page describes it.

## The extension object (default export)

`src/index` default-exports a plain object matching the `Extension` interface
(`platform/core/src/extensions/ExtensionManager.ts`):

```ts
export interface Extension {
  id: string;
  preRegistration?: (p: ExtensionParams) => Promise<void> | void;
  getHangingProtocolModule?: (p: ExtensionParams) => unknown;
  getCommandsModule?: (p: ExtensionParams) => CommandsModule;
  getViewportModule?: (p: ExtensionParams) => unknown;
  getUtilityModule?: (p: ExtensionParams) => unknown;
  getCustomizationModule?: (p: ExtensionParams) => unknown;
  getSopClassHandlerModule?: (p: ExtensionParams) => unknown;
  getToolbarModule?: (p: ExtensionParams) => unknown;
  getPanelModule?: (p: ExtensionParams) => unknown;
  onModeEnter?: (p: AppTypes) => void;
  onModeExit?: (p: AppTypes) => void;
}
```

- `id` is the only required field.
- Every other field is optional. An extension supplies only the module getters
  it implements.
- `registerExtension` is `async` and `await`s `preRegistration` before
  registering any module, so `preRegistration` may perform async setup.
- Registration **throws `Extension ID not set`** if `id` is missing or falsy.
- A **duplicate `id` is skipped with a warning** (not an error): the second
  registration returns early without duplicating modules.

## `id` MUST equal the package name (normative)

The runtime loader caches loaded modules by `packageName`, and Mode dependency
resolution re-resolves bare package names, so the extension `id` **MUST** equal
the `name` field in `package.json`. Derive it — never hardcode a divergent
string:

```ts title="src/id.ts"
import packageJson from '../package.json';

const id = packageJson.name;

export { id };
```

If `id !== package.json name`, the extension may register in a build-time host
but will fail to resolve as a Mode dependency and will not be found by the
runtime loader.

## Module getter signature

Every `get*Module` function is called with exactly this params object
(`ExtensionManager.ts`):

```js
{ appConfig, commandsManager, servicesManager, hotkeysManager, extensionManager, configuration }
```

`hotkeysManager` is passed at runtime even though the published `ExtensionParams`
type does not list it — this is the runtime truth; you may rely on it.

Access services through `servicesManager.services` (destructure by name).
Subscribe with `service.subscribe(EVENT, cb)` and unsubscribe on cleanup; prefer
pub-sub over polling effects.

## The `name` rule for module entries

Except for `commandsModule`, every element returned by a module getter **MUST**
have a `name`. The manager iterates the returned array and **throws**
`Extension ID <extensionId> module <moduleType> element has no name` for any
element missing one.

Each registered element is keyed as:

```
`${extensionId}.${moduleType}.${element.name}`
```

The `moduleType` is one of the 12 module types
(`platform/core/src/extensions/MODULE_TYPES.js`):

| Constant           | moduleType string       |
| ------------------ | ----------------------- |
| `COMMANDS`         | `commandsModule`        |
| `CUSTOMIZATION`    | `customizationModule`   |
| `STATE_SYNC`       | `stateSyncModule`       |
| `DATA_SOURCE`      | `dataSourcesModule`     |
| `PANEL`            | `panelModule`           |
| `SOP_CLASS_HANDLER`| `sopClassHandlerModule` |
| `TOOLBAR`          | `toolbarModule`         |
| `VIEWPORT`         | `viewportModule`        |
| `CONTEXT`          | `contextModule`         |
| `LAYOUT_TEMPLATE`  | `layoutTemplateModule`  |
| `HANGING_PROTOCOL` | `hangingProtocolModule` |
| `UTILITY`          | `utilityModule`         |

`commandsModule` is the exception: its shape is
`{ actions?, definitions, defaultContext? }`. `defaultContext` defaults to
`'VIEWER'` when omitted, and its entries are keyed by command name inside that
context rather than by an element `name`.

## Build contract (v1 = UMD)

A v1 plugin is a UMD bundle. The build sets `output.library` to:

```js
{ name: pkg.name, type: 'umd', export: 'default' }
```

so the bundle assigns the extension's default export to
`window['@scope/name']` (the global keyed by the full package name).

The following are **externals** — the host provides them as globals (with one
exception, `vtk.js`, noted below); a plugin must never bundle or import its own
copy:

```js
[/\b(vtk.js)/, /\b(dcmjs)/, /\b(gl-matrix)/, /^@ohif/, /^@cornerstonejs/, 'react', 'react-dom', 'react/jsx-runtime']
```

The host assigns its singleton copies to `window`, keyed by full package name.
The complete shared set is (`platform/app/src/runtimeShared.ts`):

`react`, `react-dom`, `react/jsx-runtime`, `@ohif/core`, `@ohif/ui-next`,
`@ohif/i18n`, `@ohif/extension-default`, `@ohif/extension-cornerstone`,
`@cornerstonejs/core`, `@cornerstonejs/tools`, `dcmjs`, `gl-matrix`.

`@ohif/i18n` is shared because runtime extensions dereference it during module
evaluation. `@ohif/ui` is intentionally **not** shared: it is legacy and a
forbidden import for runtime plugins — use `@ohif/ui-next`.

`vtk.js` is externalized (never bundle it) but is **not** in the shared set
above — it has no host global, a known v1 gap. A runtime-loaded plugin that
imports `vtk.js` resolves it to `undefined` at load and breaks, so do not depend
on `vtk.js` in a runtime plugin.

Do not edit `output.library` or `externals` in the build config (`.rspack/`) —
that is the host contract, not plugin-tunable.

## `package.json` contract

- `keywords` MUST include `"ohif-extension"` (build-time discovery relies on
  it).
- `peerDependencies["@ohif/core"]` is a range checked **fail-closed** against
  the running host, with `includePrerelease`. A mismatch refuses the load; keep
  it accurate.
- Development fields (`main` / `module`) point at `src` so an in-tree
  or directory-mode host resolves source directly. There is no `types` field
  and no `exports` map in the v1 contract — the build emits a UMD bundle, not
  TypeScript declarations, so do not add a `types` entry pointing at a `.d.ts`
  file the toolchain does not produce.
- `publishConfig` rewrites only `main` / `module` to `dist` on publish. These
  field overrides work **only with `pnpm publish`** — the npm CLI ignores them,
  so publish with pnpm.
- `files` is `["dist", "src", "public", "README.md"]`.

## Installing into a host

There are two ways to get a built extension into a viewer.

### Build-time

Add an explicit entry to
[`platform/app/pluginConfig.json`](./pluginConfig.md), or run
`pnpm plugin add <pkg>` in a Viewers checkout, then rebuild. See
[Extension Installation](./installation.md).

### Runtime (Track B)

Add a descriptor to `window.config.extensions` in `app-config.js` — no viewer
rebuild. See [Runtime Extensions](./runtime-extensions.md). The full descriptor:

```js
{
  packageName,        // MUST equal the extension id
  importPath,         // URL to the built bundle
  globalName,         // UMD only — see rule below; ESM MUST omit it
  coreVersionRange,   // checked fail-closed against the host @ohif/core version
  integrity,          // required for cross-origin loads
  styles: [],         // optional CSS URLs
}
```

- **`globalName` is a strict format discriminator (C3-strict).** For a UMD
  runtime bundle it MUST be set; the loader then returns `window[globalName]`.
  For an ESM bundle it MUST be omitted; the loader returns the module's default
  export. The loader **never** defaults `globalName` to `packageName` — omitting
  it on a UMD bundle yields a blank/undefined global and the load fails.
- Origins are **deny-by-default**: same-origin is implicit; any other origin
  must be listed in `window.config.runtimeExtensionOrigins`.
- `coreVersionRange` is checked **before any network import**; a mismatch
  refuses the load.
- Every attempt — success **and** failure, with host-vs-required versions — is
  recorded on `window.__ohif.runtimeExtensions` for agent self-diagnosis.

The **normative reference** for descriptor fields, the origin allowlist, the
audit record shape, and the CSP/CORS requirements is
[Runtime Extensions and Modes (Track B)](../../configuration/configurationFiles.md#runtime-extensions-and-modes-track-b).

## AGENTS.md

The scaffolder ships an `AGENTS.md` at the package root that restates these
rules for a coding agent working inside the generated project. The canonical
content is below (kept byte-identical to
`platform/create-ohif/templates/extension/AGENTS.md`):

<!-- AGENTS_MD_START -->
```md
# AGENTS.md — {{name}} (OHIF extension)

## What this package is

An OHIF v3 extension built as a UMD bundle (plugin Contract v1). The default export of
`src/index.tsx` is the extension object; its `id` MUST equal package.json `name`. The deployable
artifacts are `dist/index.umd.js` and `dist/index.css`.

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
   (see `.rspack/pluginExternals.js`); the host provides them.
4. Never import `@ohif/ui` — it is legacy and the host does not provide it to runtime plugins.
   Use `@ohif/ui-next`.
5. Do not edit `output.library` / `externals` in `.rspack/` — that is the host contract.
6. Keep `keywords: ["ohif-extension"]` and the `@ohif/core` peerDependency range accurate — the
   host refuses to load on range mismatch.
7. Keep package.json `module` pointing at `src/index.tsx` — directory-mode loading
   (pluginConfig `directory`) resolves the package through that field.
8. CSS must be compiled into `dist/index.css`, self-contained (Tailwind scans only this package;
   preflight stays off). Never rely on host stylesheets.
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
```
<!-- AGENTS_MD_END -->

## Testing

The scaffolder ships a headless contract smoke test. It constructs the real
`@ohif/core` manager stack (or mock managers mirroring the same registration
contract), registers the extension exactly as the app does, and asserts that:

- the extension `id` equals `package.json` `name` and registers exactly once;
- each shipped module element is registered under
  `<id>.<moduleType>.<name>`;
- shipped commands are registered in their context;
- a shipped hanging protocol is added to the `HangingProtocolService`;
- a shipped default customization exposes its declared slots.

Run it with `pnpm test`. Because it exercises the real registration path (not
mocks of it), removing a `name` from a module element makes the test fail with
the host's own `element has no name` throw — the same failure a deployed host
would produce.

### What the smoke test cannot prove

The headless harness has no browser and no GPU. It cannot verify:

- cornerstone / WebGL rendering, or any pixel output;
- actual viewport mounting in the grid;
- hanging-protocol layout execution against real studies;
- Tailwind styling and the compiled `dist/index.css`;
- DICOMweb data loading;
- toolbar and hotkey interaction.

### E2E fallback

To prove rendering and interaction, run a viewer host with the plugin installed
and drive it with Playwright:

- **Build-time:** in a Viewers checkout, `pnpm plugin add <pkg>` then
  `pnpm dev`.
- **Runtime:** serve the built bundle against the released docker image with a
  `/plugins/` mount and a Track B descriptor.

Contributors working inside the Viewers monorepo should follow
`.agents/skills/ohif-test-agent/SKILL.md` for the fixture system and page
objects. A minimal Playwright assertion loads a study and checks that the
extension's own UI (for the reference extension, its overlay text) is visible.

## Failure modes for agents

| Symptom | Cause | Fix |
| --- | --- | --- |
| Bundle loads but `window[globalName]` is `undefined` / blank | `output.library.name` wrong, or a UMD runtime descriptor omitted `globalName` | Set `output.library.name = pkg.name`; set `globalName` on UMD runtime descriptors (never on ESM) |
| Throws `Extension ID not set` | Default export has no `id` (or `id` is falsy) | Derive `id` from `package.json` `name` in `src/id.ts` |
| Throws `... module <type> element has no name` | A module getter returned an element without `name` | Add a `name` to every element (all types except `commandsModule`) |
| Load refused before any network request | `coreVersionRange` (runtime) or `peerDependencies["@ohif/core"]` (build) does not satisfy the host version | Widen/correct the range to include the host `@ohif/core` version; inspect `window.__ohif.runtimeExtensions` for host-vs-required versions |
| Runtime load refused with an origin message | Bundle origin not in the allowlist | Add the origin to `window.config.runtimeExtensionOrigins` (same-origin is implicit) |
| Extension registers build-time but is not found as a Mode dependency or by the runtime loader | `id !== package.json name` | Make `id` equal the package name |
| UI renders unstyled | Tailwind content gap — CSS not compiled into a self-contained `dist/index.css`, or reliance on host stylesheets | Compile self-contained CSS into `dist/index.css`; do not depend on host styles |
| Duplicate/missing modules after registering twice | Duplicate `id` is skipped with a warning, not an error | Ensure each extension `id` is unique |
