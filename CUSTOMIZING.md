# Customizing OHIF

**Index of every supported way to change what the OHIF Viewer does, and which
build procedure each one implies.** Written for both humans and coding agents:
pick the *lowest* row that satisfies the requirement, because the cost of each
mechanism rises down the table.

The rule this file exists to enforce: **you should never have to modify a file
inside this repository to ship a customized viewer.** If you believe you do,
you have most likely missed one of the rows below — check before forking.

---

## Pick a mechanism

| # | I want to… | Mechanism | Rebuild? | Owns which file |
| - | ---------- | --------- | -------- | --------------- |
| 1 | Change data sources, hotkeys, feature flags, white labeling | [`app-config.js`](platform/docs/docs/configuration/configurationFiles.md), selected with `APP_CONFIG` | No — it is copied, not compiled | Your own `config/*.js` |
| 2 | Load a different config per deployment/tenant at runtime | `?configUrl=` + `dangerouslyUseDynamicConfig` (`origins` allowlist / anchored `regex`) | No | Your hosted JSON |
| 3 | Change labels, panels, menus, viewport overlays, measurement formatting | [Customization Service](platform/docs/docs/platform/services/customization-service/customizationService.md) — `customizationService.customizations` in an app config, a mode, or an extension | No, from an app config | Your app config / your extension |
| 4 | Add an extension or mode **without** rebuilding the viewer | [Runtime extension descriptor](platform/docs/docs/platform/extensions/runtime-extensions.md) in `window.config.extensions` / `.modes` + `runtimeExtensionOrigins` | No | Your prebuilt UMD/ESM bundle |
| 5 | Change the served route, HTML template, or dev proxy | [Build profile](platform/docs/docs/configuration/build-profiles.md) (`OHIF_ENV`) → `publicUrl`, `htmlTemplate`, `proxy` | Yes | Your `ohif.config.json` |
| 6 | Compile in **my own** set of extensions/modes | Your own `pluginConfig.json`, selected with `PLUGIN_CONFIG` or a profile's `pluginConfig` | Yes | Your `pluginConfig.json` |
| 7 | Develop plugins against a pinned OHIF, in my own repo | `pnpm create ohif` → [workspace template](platform/docs/docs/development/create-ohif.md#workspace-recommended) (gitignored `.ohif/` checkout, never written to) | Yes (managed for you) | Your whole repo |
| 8 | Write a new extension / mode | [Extension contract](platform/docs/docs/platform/extensions/index.md), [`pnpm create ohif`](platform/docs/docs/development/create-ohif.md), [agent guide](platform/docs/docs/platform/extensions/building-with-agents.md) | Yes, to bundle it (no, if loaded per row 4) | Your package |
| 9 | Change core behavior no extension point exposes | Open an issue/PR proposing an extension point — **then** fork if it is rejected | — | — |

Rows 1–4 need no build at all. Rows 5–7 are the same build, pointed at files you
own. Row 9 is the only one that means editing this repo, and it is a last resort:
a fork pays the merge cost on every OHIF release, forever.

---

## Build procedures

Every procedure below is the *same* build; only its inputs differ.

### Default

```bash
pnpm install
pnpm run build          # or: pnpm run dev
```

Reads `platform/app/pluginConfig.json` and `config/default.js` (production) /
`config/dev.js` (dev server).

### Individual environment variables

| Variable | Meaning |
| -------- | ------- |
| `PLUGIN_CONFIG` | Path to the `pluginConfig.json` to compile from |
| `APP_CONFIG` | App config to ship as `app-config.js` — relative to `platform/app/public`, or an absolute path |
| `PUBLIC_URL` | Route the viewer is served from (`/viewer/`) |
| `HTML_TEMPLATE` | Filename under `platform/app/public/html-templates` |
| `ENTRY_TARGET` | Alternative JS entry module |
| `OHIF_ENV` | Path to a build profile supplying defaults for all of the above |

```bash
PLUGIN_CONFIG=/srv/deploy/pluginConfig.json APP_CONFIG=config/mine.js pnpm run build
```

### Build profile (preferred for a deployment)

One committed JSON file instead of a growing `cross-env A=1 B=2` command:

```bash
OHIF_ENV=./ohif.config.json pnpm run build
```

```json title="ohif.config.json"
{
  "pluginConfig": "./pluginConfig.json",
  "appConfig": "./config/hospital.js",
  "publicUrl": "/viewer/"
}
```

An environment variable that is already set always wins over the profile, so one
CI job can override a single key. Reference:
[Build Profiles](platform/docs/docs/configuration/build-profiles.md) ·
schema: [`ohif.schema.json`](ohif.schema.json).

### Out-of-tree plugin folders

A `pluginConfig.json` you own declares `root` so its `./`-relative `directory`
values — and its own `extensions/` and `modes/` folders — resolve against your
repo, while OHIF's own plugins keep resolving inside the checkout:

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

References: [`pluginConfig.json`](platform/docs/docs/platform/extensions/pluginConfig.md) ·
schema: [`platform/app/pluginConfig.schema.json`](platform/app/pluginConfig.schema.json).

### Managed workspace

```bash
pnpm create ohif@beta my-viewer -t workspace
cd my-viewer && pnpm install && pnpm dev
```

`ohif.config.json` pins the OHIF version, lists your plugins, and *is* the build
profile. The harness clones that tag into a gitignored `.ohif/`, derives
`pluginConfig.generated.json`, and builds — writing nothing inside the checkout.

### Runtime plugins (no rebuild)

Serve prebuilt bundles next to the viewer and declare descriptors in
`app-config.js`. Cross-origin bundles require `integrity` and an entry in
`runtimeExtensionOrigins`; see
[Runtime Plugins & CSP](platform/docs/docs/deployment/runtime-plugins.md) and
[Where integrity is enforced](platform/docs/docs/configuration/configurationFiles.md#where-integrity-is-enforced).

---

## Files you should not edit (and what to do instead)

| Tempting edit | Do this instead |
| ------------- | --------------- |
| `platform/app/pluginConfig.json` | Your own copy + `PLUGIN_CONFIG` / profile `pluginConfig` (row 6) |
| `platform/app/public/config/*.js` | Your own app config + `APP_CONFIG`, or a `./`-prefixed profile `appConfig` (row 1) |
| A `cross-env …` line in `platform/app/package.json` | A build profile (row 5) |
| `platform/app/src/pluginImports.js` | Generated — never hand-edit; it is regenerated from `pluginConfig.json` on every build |
| Any `platform/core` service, to change UI text or behavior | Customization Service (row 3) |
| An extension under `extensions/`, to tweak its behavior | Your own extension + customizations (rows 3, 8) |

## For agents

- Determine the **lowest-numbered** row that satisfies the request, and say which
  row you chose and why before writing code.
- If the request seems to need a change inside this repo, re-read rows 1–8 first;
  state explicitly which extension point is missing before proposing a core edit.
- Validate configuration you generate against the schemas
  (`ohif.schema.json`, `platform/app/pluginConfig.schema.json`) — the build
  enforces them and fails with the offending key.
- `pnpm run plugin doctor` is the health check for anything plugin-declaration
  related; it reports which config and profile it used.
- Deeper agent-facing contract summary for writing plugins:
  [building-with-agents.md](platform/docs/docs/platform/extensions/building-with-agents.md).
- Repo conventions and architecture: [AGENTS.md](AGENTS.md).
