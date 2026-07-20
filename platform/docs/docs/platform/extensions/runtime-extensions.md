---
sidebar_position: 7
sidebar_label: Runtime Extensions
title: Runtime Extensions
summary: Load prebuilt extension and mode bundles at runtime through descriptor entries in app-config.js — no viewer rebuild. Quick descriptor example plus a pointer to the normative reference for fields, the origin allowlist, the audit surface, and CSP requirements.
---

# Runtime Extensions

Runtime extensions let a deployment load prebuilt extension/mode bundles at
runtime with no viewer rebuild: entries in `window.config.extensions` and
`window.config.modes` may be descriptor objects instead of plain strings.

```js title="app-config.js"
window.config = {
  // ...
  extensions: [
    {
      packageName: '@acme/extension-foo', // MUST equal the extension id
      importPath: '/plugins/extension-foo/index.umd.js',
      globalName: '@acme/extension-foo', // UMD builds MUST set this; ESM builds MUST omit it
      coreVersionRange: '>=3.13.0-beta.0 <4',
      integrity: 'sha384-...', // required cross-origin
      styles: ['/plugins/extension-foo/index.css'],
    },
  ],
};
```

- Origins are **deny-by-default**: same-origin is implicit, anything else must
  be listed in `window.config.runtimeExtensionOrigins`.
- `coreVersionRange` is checked against the host version **fail-closed**: a
  mismatch refuses the load before any network import.
- `globalName` is a strict format discriminator — present means UMD (the
  loader returns `window[globalName]`), absent means ESM (the loader returns
  the module's default export). It is never defaulted to `packageName`.
- Every attempt (success and failure) is recorded on
  `window.__ohif.runtimeExtensions`.
- **CSP:** the viewer's two inline bootstrap scripts mean a deployment
  `CSP_HEADER` must interim-add `'unsafe-inline'` to `script-src` (until the
  inline-script hash handshake ships), and cross-origin integrity loads run
  through a `blob:` URL, so `script-src` must also include `blob:`.

The **normative reference** for the descriptor fields, the
`runtimeExtensionOrigins` allowlist, the audit record shape, and the CSP/CORS
requirements is
[Runtime Extensions and Modes (Track B)](../../configuration/configurationFiles.md#runtime-extensions-and-modes-track-b)
in the Configuration Files guide.
