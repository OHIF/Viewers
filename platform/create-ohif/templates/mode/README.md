# {{name}}

{{description}}

An OHIF Viewer mode (UMD plugin Contract v1). The deployable artifact is `dist/index.umd.js`.

A mode is a viewer workflow: it declares routes, layout, panels, viewports, and tool bindings,
all resolved from extensions. Every extension named in `extensionDependencies`
(`src/index.ts`) must be present in the host — bundled into the viewer build or itself loaded
as a runtime extension — or the mode will not become routable.

## Quickstart

```bash
pnpm install
pnpm dev        # watch build
pnpm build      # production build to dist/
pnpm test       # headless contract smoke test
pnpm typecheck
```

## Load into OHIF

### 1. Runtime descriptor (no viewer rebuild)

Host the built `dist/` at `/plugins/{{dirName}}/` next to the viewer and add a descriptor to
`app-config.js` under `modes`:

```js
{
  packageName: '{{name}}',
  importPath: '/plugins/{{dirName}}/index.umd.js',
  globalName: '{{name}}', // UMD contract: the global equals the package name
  coreVersionRange: '{{coreRange}}',
}
```

### 2. Local checkout, directory mode

In an OHIF Viewers checkout, add to `platform/app/pluginConfig.json` under `modes`:

```json
{ "packageName": "{{name}}", "directory": "~/path/to/{{dirName}}" }
```

The host compiles this package from source (`module: src/index.ts`) — no build needed here.

### 3. From npm

Publish this package, then in an OHIF Viewers checkout run:

```bash
pnpm plugin add {{name}}
```

## Publishing

```bash
pnpm publish
```

Use pnpm, not npm: `publishConfig` rewrites `main`/`module` to `dist/index.umd.js` at pack time.
`dist/index.umd.js` is the artifact a deployment serves.
