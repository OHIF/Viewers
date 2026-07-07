---
sidebar_position: 7
sidebar_label: Customization URL & config lockdown
title: '?customization= URL parameter and the secure default config'
---

# `?customization=` URL parameter and the secure default config

3.13 adds the ability to load customizations at runtime from the
`?customization=` URL parameter, and as part of that it **locks down the default
configuration**. Both changes can affect existing deployments.

## `?customization=` is off by default

A `?customization=` value loads a **JSONC data file** (JSON with comments /
trailing commas) and applies its `global` payload as global customizations. The
file is fetched and parsed as **data — it is never executed**. Executable code
(plugins, modes, extensions) still loads only through `pluginConfig.json`.

The feature is **off until you configure an allowlist of prefixes** in the app
config. This is an **app-config property, not a customization** — a customization
could itself be loaded from the URL, so it must not be able to widen its own
allowlist.

```js
window.config = {
  customizationUrlPrefixes: {
    // The `default` prefix (no slashes) handles values with no leading slash.
    default: './customizations/', // ?customization=ctPresets -> ./customizations/ctPresets.jsonc
    // Every other prefix MUST start and end with a slash and is matched against
    // the leading `/segment/` of the value.
    '/remote/': 'https://cdn.example.com/ohif-customizations/', // ?customization=/remote/siteA
  },
};
```

Resolution rules:

- `?customization=ctPresets` → `default` prefix → `./customizations/ctPresets.jsonc`
- `?customization=/remote/siteA` → `/remote/` prefix → `https://cdn.example.com/ohif-customizations/siteA.jsonc`
- **A value whose prefix is not configured throws and aborts startup** rather than
  being silently ignored. With no `customizationUrlPrefixes` configured, *any*
  `?customization=` value throws. (Note: because the `default` prefix has no
  slashes, an explicit `/default/x` is treated as the `/default/` prefix and is
  rejected unless you configure that key — use the bare `x` form instead.)

If you previously enabled this feature via the `ohif.customizationUrl`
**customization** (an early iteration of this PR), move the `prefixes` map to the
top-level `customizationUrlPrefixes` **app-config** property and drop the
`prefixes` wrapper key:

```js
// Before (customization — no longer read)
customizationService: [{ 'ohif.customizationUrl': { $set: { prefixes: { default: './customizations/' } } } }],

// After (app config property)
customizationUrlPrefixes: { default: './customizations/' },
```

## Phase-tagged customizations (lifecycle ordering)

A customization module — whether loaded from a `?customization=` data file or
declared inline in `appConfig.customizationService` — can tag its payload with
the lifecycle phase it should be applied in. This makes ordering deterministic
regardless of when extensions and modes load, and lets a single source target
the bootstrap, global, and mode-entry time frames at once.

```jsonc
{
  // Other customization data files to resolve FIRST (depth-first). Each entry is
  // itself a `?customization=` value — a customization module name resolved
  // through the same `customizationUrlPrefixes` rules — NOT a customization id.
  // So `"requiredCustomizationToLoad"` fetches
  // ./customizations/requiredCustomizationToLoad.jsonc (via the `default` prefix)
  // and applies its phase blocks before this file's.
  "requires": ["requiredCustomizationToLoad"],

  // Applied (Global scope) BEFORE extensions register — in place while they init.
  "bootstrap": { "someId": { "$set": "value" } },

  // Applied (Global scope) AFTER extensions register / init — so `$apply`-style
  // merges can build on extension-provided defaults.
  "global": { "workList.columns": { "$splice": [[1, 0, { "id": "patientBirthDate", "meta": { "label": "Birth Date" } }]] } },

  // Applied (Mode scope) on EVERY mode enter. The reserved `*` (general) block
  // is applied first; a block keyed by the entered mode's id / routeName is
  // applied after it, so a single mode can override the general values.
  "mode": {
    "*": { "someId": { "$set": "all modes" } },
    "viewer": { "someId": { "$set": "viewer only" } }
  }
}
```

The same shape is accepted by the app config. The legacy array / object form is
still supported and is applied to the Global scope during `init()` exactly as
before:

```js
window.config = {
  // `customizationUrlPrefixes` is a top-level app-config (window.config) property,
  // deliberately NOT part of `customizationService`. The `customizationService`
  // block below — and any customization loaded from a `?customization=` URL — can
  // never read or widen this allowlist, because a URL-loaded customization must
  // not be able to grant itself new load locations. It can only be changed here,
  // in the global config, which is not itself updatable by any customization.
  customizationUrlPrefixes: { default: './customizations/' },
  customizationService: {
    requires: ['patientBirthDate'],            // resolves ./customizations/patientBirthDate.jsonc
    global: [                                  // mixes string references and inline maps
      '@ohif/extension-default.customizationModule.datasources',
      { 'workList.variant': 'default' },
    ],
    mode: {
      '*': { 'someId': { $set: 'all modes' } },
      viewer: { 'someId': { $set: 'viewer only' } },
    },
  },
};
```

How the phases map onto the boot sequence:

| Phase | When | Scope |
| --- | --- | --- |
| `requires` | resolved up front (before extensions register) | — (loads other modules) |
| `bootstrap` | before `extensionManager.registerExtensions` | Global |
| `global` | after extensions register + `customizationService.init` | Global |
| `mode` | on each mode enter, after the mode scope is reset | Mode |

All `?customization=` data files and `requires` are **fetched once, up front**
(well before any mode loads); only the *application* of each phase block is
deferred to its lifecycle point.

> Note: a `?customization=` data file is JSON and cannot carry render functions.
> The WorkList expands a serializable column spec (an entry with an `id` and
> `meta` but no `accessorFn`/`cell`) into a display-only text column that reads
> `row[id]`, which is how the `patientBirthDate` example above renders.

## `config/default.js` is now a secure, minimal baseline

`config/default.js` — what a plain production build with no `APP_CONFIG` emits —
is now deliberately locked down. The most impactful part of this is the **data
source list**, which previously shipped seven sources and now ships **one**.

### Data sources removed from `config/default.js`

| `sourceName` | Type | Why it was removed |
| --- | --- | --- |
| `ohif2` | DICOMweb (AWS CloudFront `dd14fa38…`) | Extra read-only demo server; not needed in a baseline. |
| `ohif3` | DICOMweb (AWS CloudFront `d3t6nz73…`) | Extra read-only demo server; not needed in a baseline. |
| `local5000` | DICOMweb (`http://localhost:5000`) | Points at a local dev PACS that does not exist in a real deployment. |
| `orthanc` | DICOMweb (`http://localhost/pacs/dicom-web`) | Points at a local dev PACS that does not exist in a real deployment. |
| `dicomjson` | Runtime `?url=` JSON metadata | Loads metadata from an arbitrary `?url=`; widens the attack surface of a default build. Gate with `dangerouslyAllowedOriginsForAuthenticatedEnvironments` if you re-enable it. |
| `dicomwebproxy` | Runtime `?url=` delegating proxy | Driven by `?url=`; same attack-surface concern as `dicomjson`. |
| `dicomlocal` | Local file (drag-and-drop) | Loads DICOM files from the user's machine; not appropriate for a locked-down baseline. |

### What remains

- A single **read-only demo DICOMweb source** (`sourceName: 'ohif'`,
  `defaultDataSourceName: 'ohif'`) — replace its `wadoRoot` / `qidoRoot` /
  `wadoUriRoot` with your own DICOMweb server.

### Other lockdowns in `config/default.js`

- The `multimonitor` layouts were removed.
- `?customization=` is off (no `customizationUrlPrefixes`).
- `dangerouslyUseDynamicConfig` (the `configUrl` query parameter) is off.

### If you relied on the old `default.js`

If your deployment relied on `default.js` shipping the local/`?url=` data sources
or the full demo source list, you have two options:

- **Point the dev/demo configs at it**: copy the `dataSources` entries you need
  from `config/dev.js` or `config/netlify.js` into your own config, or
- **Build with a different config**: set `APP_CONFIG` to your own config file at
  build time (`APP_CONFIG=config/my-site.js pnpm run build`).

## New `config/dev.js`; dev server no longer uses `default.js`

- **`config/dev.js`** (new) is the full-featured local-development config: every
  data source enabled and `?customization=` turned on. The dev-server scripts
  (`pnpm run dev`, `dev:fast`, `start`) now default to `config/dev.js`.
- **`config/netlify.js`** is the public demo / Netlify deploy config: the full
  data source set plus `customizationUrlPrefixes: { default: './customizations/' }`.
- **`config/default.js`** remains the fallback for a real production build
  (`pnpm run build` with no `APP_CONFIG`).

### `APP_CONFIG` is honored, not clobbered

The default config is selected by the build (`webpack.pwa.js` / `rsbuild.config.ts`),
**not** hard-coded into the npm scripts, so an explicit `APP_CONFIG` always wins:

- `pnpm run dev` (no `APP_CONFIG`) → `config/dev.js`
- `APP_CONFIG=config/local_orthanc.js pnpm run dev` → **`config/local_orthanc.js`**
- `pnpm run build` (no `APP_CONFIG`) → `config/default.js`
- `APP_CONFIG=config/my-site.js pnpm run build` → **`config/my-site.js`**

The rule is: **the dev server defaults to `config/dev.js` and a production build
to `config/default.js`, but any explicit `APP_CONFIG` overrides the default.** So
if you maintain your own dev tooling that expected `pnpm run dev` to use
`config/default.js`, just set `APP_CONFIG=config/default.js` explicitly.
