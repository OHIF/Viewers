---
sidebar_position: 2
sidebar_label: Build Profiles (OHIF_ENV)
title: Build Profiles (OHIF_ENV)
summary: Point a viewer build at configuration you own — your own pluginConfig.json, app config, public URL and HTML template — with a single OHIF_ENV profile file, instead of editing files inside the OHIF checkout. Covers the profile schema, precedence against environment variables, the pluginConfig "root" key for out-of-tree plugin folders, and PLUGIN_CONFIG on its own.
---

# Build Profiles (`OHIF_ENV`)

A **build profile** is a JSON file that supplies the build's inputs — which
plugins to compile in, which app config to ship, what URL the viewer is served
from — so a downstream deployment never has to edit a file inside the OHIF
checkout to produce its own viewer.

```bash
OHIF_ENV=./ohif.config.json pnpm run build
```

```json title="ohif.config.json"
{
  "pluginConfig": "./pluginConfig.json",
  "appConfig": "./config/hospital.js",
  "publicUrl": "/viewer/",
  "htmlTemplate": "index.html"
}
```

Without a profile nothing changes: the build reads
`platform/app/pluginConfig.json` and the defaults it always did.

:::note Same file as the workspace manifest
This is the same `ohif.config.json` that `pnpm create ohif`'s
[workspace template](../development/create-ohif.md#workspace-recommended)
commits. Keys the build does not use (`ohifVersion`, `plugins`) are accepted and
ignored, so a workspace's manifest and its build profile are one artifact.
:::

## Keys

The normative shape — every key, with descriptions — is
[`platform/app/ohif.schema.json`](https://github.com/OHIF/Viewers/blob/master/platform/app/ohif.schema.json).
It ships in the `@ohif/app` package, so point your editor's `$schema` at
whichever copy you have for completion and validation:

```json
{ "$schema": "./node_modules/@ohif/app/ohif.schema.json" }
```

In a `create-ohif` workspace the harness checkout is the copy:
`./.ohif/platform/app/ohif.schema.json` (present after the first
`harness ensure`).

| Key | Environment variable | Notes |
| --- | --- | --- |
| `pluginConfig` | `PLUGIN_CONFIG` | The `pluginConfig.json` to compile from. Resolved against the profile's directory. |
| `appConfig` | `APP_CONFIG` | Copied to `dist/app-config.js`. Relative to `platform/app/public` (`config/default.js`), **or** a `./`-prefixed path resolved against the profile — how a deployment ships an app config it owns. |
| `publicUrl` | `PUBLIC_URL` | Route the viewer is served from. Must start and end with `/`. |
| `htmlTemplate` | `HTML_TEMPLATE` | Filename under `platform/app/public/html-templates`. |
| `entryTarget` | `ENTRY_TARGET` | Alternative JS entry module. Resolved against the profile's directory. |
| `proxy.*` | `PROXY_TARGET`, `PROXY_DOMAIN`, `PROXY_PATH_REWRITE_FROM`, `PROXY_PATH_REWRITE_TO` | Dev-server proxy only. |
| `ohifVersion`, `plugins` | — | `create-ohif` workspace harness only; ignored by the build. |

## Precedence: environment variables win

A profile supplies **defaults**. Any variable already set in the environment is
left alone, so a committed profile stays overridable per invocation:

```bash
# ohif.config.json says publicUrl "/viewer/"; this build uses "/staging/"
OHIF_ENV=./ohif.config.json PUBLIC_URL=/staging/ pnpm run build
```

## Failure is loud

A profile that is missing, malformed, or has an unknown key aborts the build
with the path and the offending key. It never silently falls back to the default
configuration — a build that quietly compiled the wrong plugin set would be
worse than no build.

## `PLUGIN_CONFIG` without a profile

`PLUGIN_CONFIG` also works on its own, if the plugin set is the only thing you
need to redirect:

```bash
PLUGIN_CONFIG=/srv/deploy/pluginConfig.json pnpm run build
```

It is honored by everything that reads the plugin declaration, so they cannot
disagree:

- the build's codegen and resolve aliases (`writePluginImportsFile.js`)
- Tailwind's content globs (`platform/app/tailwind.config.js`) — an out-of-tree
  plugin's `src/` is scanned, so its classes are not purged
- `pnpm run plugin add|remove|list|link|unlink|doctor`, which therefore can
  never edit a config the build ignores. `pnpm run plugin doctor` prints the
  profile and config it used whenever they are not the defaults.

## `root`: out-of-tree plugin folders

A `directory` value beginning with `./` in a `pluginConfig.json` resolves
against the **OHIF repo root** by default, which is what the in-tree config's
values mean. A config you own, sitting in your own repo, declares its own base
with `root` (resolved against the config file's directory):

```json title="/srv/deploy/pluginConfig.json"
{
  "root": ".",
  "extensions": [
    { "packageName": "@ohif/extension-default" },
    { "packageName": "@acme/extension-foo", "directory": "./extensions/foo" }
  ],
  "modes": [{ "packageName": "@ohif/mode-basic" }]
}
```

With `root: "."`, `@acme/extension-foo` resolves to `/srv/deploy/extensions/foo`
while `@ohif/extension-default` still resolves inside the OHIF checkout — both
trees are searched, yours first. Declaring `root` also makes your own
`extensions/` and `modes/` folders discoverable **by package name**, so plugins
that live there need no `directory` entry at all.

Omitting `root` preserves the historical meaning exactly, so no existing config
changes behavior.

## What a profile does not do

Build profiles only replace build-time *inputs*. They do not change what the
viewer can do at runtime, and they are not a way to avoid rebuilding:

- To change configuration without rebuilding, use
  [`app-config.js`](configurationFiles.md) (the `APP_CONFIG` file is copied, not
  compiled) or the `configUrl` parameter.
- To add an extension without rebuilding, use a
  [runtime extension descriptor](../platform/extensions/runtime-extensions.md).
- For the full menu, see
  [CUSTOMIZING.md](https://github.com/OHIF/Viewers/blob/master/CUSTOMIZING.md).
