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
Everything on this page applies to modes as well: the `runtimePluginOrigins`
allowlist covers both, and each record in `window.__ohif.runtimePlugins` has a
`kind` of `'extension'` or `'mode'`.

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
  be listed in `window.config.runtimePluginOrigins`.
- `coreVersionRange` is checked against the host version **fail-closed**: a
  mismatch refuses the load before any network import.
- `globalName` is a strict format discriminator — present means UMD (the
  loader returns `window[globalName]`), absent means ESM (the loader returns
  the module's default export). It is never defaulted to `packageName`.
- Every attempt (success and failure) is recorded on
  `window.__ohif.runtimePlugins`.
- `integrity` is enforced on **this** (descriptor) path only. Build-time
  `pluginConfig.json` `importPath` entries are trusted outright, and the URL
  fallthrough / `peerImport` path is gated by the origin allowlist alone — see
  [Where integrity is enforced](../../configuration/configurationFiles.md#where-integrity-is-enforced).
  For the commands that produce the value, see
  [Computing the `integrity` value](../../configuration/configurationFiles.md#computing-the-integrity-value).
- **CSP:** a deployment that sets `CSP_HEADER` must extend the baseline, both
  for the viewer itself and for cross-origin plugins; see
  [Content-Security-Policy (CSP_HEADER)](../../deployment/runtime-plugins.md#content-security-policy-csp_header).

The **normative reference** for the descriptor fields, the
`runtimePluginOrigins` allowlist and the audit record shape is
[Runtime Extensions and Modes](../../configuration/configurationFiles.md#runtime-extensions-and-modes)
in the Configuration Files guide. CSP and CORS setup is covered in the
deployment guide under
[Extending the baseline](../../deployment/runtime-plugins.md#extending-the-baseline).
