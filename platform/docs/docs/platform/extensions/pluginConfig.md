---
sidebar_position: 6
sidebar_label: pluginConfig.json
title: pluginConfig.json Reference
summary: Reference for platform/app/pluginConfig.json — the $schema, extensions, modes, and public arrays, every entry field (packageName, default, directory, and the public-entry import fields), and the three ways a plugin can be located (in-tree workspace, out-of-tree directory, or installed dependency).
---

# pluginConfig.json Reference

`platform/app/pluginConfig.json` declares which extensions, modes, and
third-party public assets are compiled into the viewer build. The build step
([`writePluginImportsFile.js`](https://github.com/OHIF/Viewers/blob/master/platform/app/.rspack/writePluginImportsFile.js))
reads it, resolves each entry to a source directory, generates the (untracked)
`pluginImports.js`, and copies each plugin's static assets into `dist`.

:::note
`pluginConfig.json` is a hand-edited file: add, remove, or configure plugins
using the fields documented below. The `pnpm run plugin` helper
(`add` / `remove` / `list` / `link` / `unlink` / `doctor`) edits the same file
for you and validates it — both workflows are equally supported. (Older docs
said this file must not be edited by hand; that guidance belonged to the
removed OHIF CLI and no longer applies.)
:::

## Top-level shape

```jsonc title="platform/app/pluginConfig.json"
{
  "$schema": "./pluginConfig.schema.json",
  "extensions": [ /* extension entries */ ],
  "modes":      [ /* mode entries */ ],
  "public":     [ /* third-party public-asset entries */ ]
}
```

| Key | Required | Description |
| --- | --- | --- |
| `$schema` | no | Path/URL of the published JSON Schema. Editors use it for completion; the build validates against it at config load and fails fast on invalid entries. |
| `extensions` | yes | Extensions to make available to the build. |
| `modes` | yes | Modes (workflows) to make available to the build. |
| `public` | no | Third-party packages whose prebuilt assets are copied/loaded at runtime (e.g. `dicom-microscopy-viewer`). Not registered as extensions or modes. |

## Extension / mode entry fields

An entry may be a bare string (the package name) or an object. The object form
supports the following fields:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `packageName` | string | — | The package's real name (matches its `package.json` `name`). Required unless `directory` alone identifies the plugin. |
| `default` | boolean | `true` | When `false`, the plugin is **not** added to the auto-registered set loaded at startup (`defaultExtensions` / `defaultModes`). It is still resolvable and can be loaded on demand — e.g. when a registered mode declares it as a required extension. |
| `directory` | string | — | An explicit source directory for an out-of-tree plugin. See [Plugin locations](#plugin-locations). |

:::info Removed field
Older configs carried a `version` field on entries — it was install
bookkeeping for the removed OHIF CLI and never affected build resolution.
It has been deleted from the repo config; remove it from yours
(`pnpm run plugin doctor` flags it).
:::

```jsonc
{
  "extensions": [
    // bare string form
    "@ohif/extension-default",

    // object form, registered by default
    { "packageName": "@ohif/extension-cornerstone" },

    // present in the build but NOT auto-registered; loaded only when a
    // registered mode requires it
    {
      "packageName": "@ohif/extension-cornerstone-dicom-seg",
      "default": false
    }
  ],
  "modes": [
    { "packageName": "@ohif/mode-longitudinal" }
  ]
}
```

## `public` entry fields

`public` entries are not extensions or modes — they describe third-party assets
that are copied into `dist` and (optionally) imported at runtime via a global.

| Field | Type | Description |
| --- | --- | --- |
| `packageName` | string | Package name, used to resolve the asset directory from `node_modules` when `directory` is not given. |
| `directory` | string | Source directory of the assets to copy. Resolved like the extension `directory` field (absolute, `~`-relative, or `.`-relative to the repo root). |
| `importPath` | string | Path/URL the runtime loader `import()`s. Absolute (`http…` or `/…`) paths are used as-is; otherwise it is prefixed with `PUBLIC_URL`. **Trusted, unverified** — see the note below. |
| `globalName` | string | If set, after importing `importPath` the loader returns `window[globalName]` (for UMD/global bundles). |
| `importName` | string | Named export to return from the imported module. Defaults to `default`. Ignored when `globalName` is set. |
| `to` | string | Destination subpath under `dist` for the copied assets. |

:::warning `importPath` is trusted build-time configuration
An `importPath` is compiled into the bundle by the codegen as a direct
`import()` of that URL. It is **not** subject to the
[`runtimeExtensionOrigins` allowlist](../../configuration/configurationFiles.md#origin-allowlist-runtimeextensionorigins)
and gets **no `integrity`/SRI check**, even when the URL is absolute and
cross-origin — changing it requires editing this file and rebuilding, which is
the same trust level as editing the app's source, so the build-time value is
trusted outright.

Runtime-supplied URLs are held to stricter rules: see
[Where integrity is enforced](../../configuration/configurationFiles.md#where-integrity-is-enforced).
Point `importPath` at an origin you control — prefer a relative path or a
`PUBLIC_URL`-served copy of the asset (the `directory` + `to` fields exist to
copy third-party bundles into `dist` for exactly this reason).
:::

```jsonc
{
  "public": [
    { "directory": "./platform/public" },
    {
      "packageName": "dicom-microscopy-viewer",
      "importPath": "dicom-microscopy-viewer/dicomMicroscopyViewer.min.js",
      "globalName": "dicomMicroscopyViewer",
      "directory": "./node_modules/dicom-microscopy-viewer/dist/dynamic-import",
      "to": "/dicom-microscopy-viewer/"
    }
  ]
}
```

## Plugin locations

Under pnpm, extensions and modes are **not** dependencies of `platform/app`.
Every entry in `pluginConfig.json` is located one of three ways — only entries
listed here are compiled in; workspace packages that are not listed are ignored.

1. **In-tree workspace** — a package under `extensions/` or `modes/`. Declare it
   by `packageName`; the build scans those workspaces and maps the declared name
   to its source directory.
2. **External, out-of-tree source** — a checkout outside this repo (e.g. an
   extension scaffolded with `pnpm create ohif`). Add a `directory` field. The path may
   be absolute, `~`-relative to the home directory, or `.`-relative to the repo
   root.

   ```jsonc
   { "packageName": "@acme/extension-foo", "directory": "~/dev/extension-foo" }
   ```
3. **Installed dependency** — add the package to the **root `package.json`** as a
   normal dependency and declare it by `packageName` (no `directory`). It then
   resolves from `node_modules` like any other installed package, and its
   `public/` and `dist/` assets are copied from there. This is the path used for
   third-party packages such as `dicom-microscopy-viewer`.

   ```jsonc
   { "packageName": "@acme/extension-foo" }
   ```

For the build internals behind these (alias generation, asset copying, the
pnpm + Rspack migration), see the
[build tooling migration guide](../../migration-guide/3p12-to-3p13/build-tooling.md#plugin-resolution-from-source-writepluginimportsfilejs).
