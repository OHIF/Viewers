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

## `config/default.js` is now a secure, minimal baseline

`config/default.js` — what a plain production build with no `APP_CONFIG` emits —
is now deliberately locked down:

- The local file data source (`dicomlocal`) and the runtime `?url=` data sources
  (`dicomjson`, `dicomwebproxy`) are **no longer enabled**.
- Only a single read-only demo DICOMweb source is configured; point it at your
  own server.
- `?customization=` is off (no `customizationUrlPrefixes`) and
  `dangerouslyUseDynamicConfig` is off.

If your deployment relied on `default.js` shipping the local/`?url=` data sources
or the full demo source list, copy what you need from `config/dev.js` or
`config/netlify.js` into your own config.

## New `config/dev.js`; dev server no longer uses `default.js`

- **`config/dev.js`** (new) is the full-featured local-development config: every
  data source enabled and `?customization=` turned on. The dev-server scripts
  (`pnpm run dev`, `dev:fast`, `start`) now default to `config/dev.js`.
- **`config/netlify.js`** is the public demo / Netlify deploy config: the full
  data source set plus `customizationUrlPrefixes: { default: './customizations/' }`.
- **`config/default.js`** remains the fallback for a real production build
  (`pnpm run build` with no `APP_CONFIG`).

If you maintain your own dev tooling that expected `pnpm run dev` to use
`config/default.js`, set `APP_CONFIG=config/default.js` explicitly, or base your
config on `config/dev.js`.
