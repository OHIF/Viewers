# {{name}}

{{description}}

An OHIF Viewer extension (UMD plugin Contract v1). The deployable artifacts are
`dist/index.umd.js` and `dist/index.css`.

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
  styles: ['/plugins/{{dirName}}/index.css'],
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
which the npm CLI does not support. `dist/index.umd.js` and `dist/index.css` are the artifacts a
deployment serves.
