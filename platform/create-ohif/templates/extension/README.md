# {{name}}

{{description}}

An OHIF Viewer extension (UMD plugin Contract v1). The deployable artifact is
`dist/index.umd.js` (styles are injected by the bundle at runtime, so there is no
separate stylesheet to serve).

## Quickstart

```bash
pnpm install
pnpm dev        # watch build
pnpm build      # production build to dist/
pnpm test       # headless registration smoke test
pnpm typecheck
```

## Load into OHIF

### 1. Runtime descriptor (no viewer rebuild)

Host the built `dist/` at `/plugins/{{dirName}}/` next to the viewer and add a descriptor to
`app-config.js` under `extensions`:

```js
{
  packageName: '{{name}}',
  importPath: '/plugins/{{dirName}}/index.umd.js',
  globalName: '{{name}}', // UMD contract: the global equals the package name
  coreVersionRange: '{{coreRange}}',
}
```

### 2. Local checkout, directory mode

In an OHIF Viewers checkout, add to `platform/app/pluginConfig.json` under `extensions`:

```json
{ "packageName": "{{name}}", "directory": "~/path/to/{{dirName}}" }
```

The host compiles this package from source (`module: src/index.tsx`) — no build needed here.

### 3. From npm

Publish this package, then in an OHIF Viewers checkout run:

```bash
pnpm plugin add {{name}}
```

## Publishing

```bash
pnpm publish
```

Use pnpm, not npm: `publishConfig` rewrites `main`/`module` to `dist/index.umd.js` at pack time,
which the npm CLI does not support. `dist/index.umd.js` is the single artifact a deployment serves;
the extension's CSS is injected by that bundle at runtime.
