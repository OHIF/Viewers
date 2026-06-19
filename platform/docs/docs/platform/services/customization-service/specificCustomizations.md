---
title: Specific Customizations
summary: Documentation for specific built-in customization keys, including URL parameter preservation and URL-driven customization module loading.
sidebar_position: 9
---

# Specific Customizations

This page documents concrete customization keys that have app-level behavior.

## `ohif.preserveCustomizationKeys`

- **Purpose**: Controls which query-string keys should be preserved while navigating between worklist and viewer routes.
- **Default behavior**: The app always preserves:
  - `configUrl`
  - `multimonitor`
  - `screenNumber`
  - `hangingProtocolId`
  - `customization`
- **How this customization is applied**: The value from `ohif.preserveCustomizationKeys` is appended to the default list above (it does not replace the defaults).

Example:

```js
window.config = {
  customizationService: [
    {
      'ohif.preserveCustomizationKeys': {
        $set: ['customizationAlt', 'experimentFlag'],
      },
    },
  ],
};
```

With this example, navigation preserves the default keys plus `customizationAlt` and `experimentFlag`.

## `ohif.customizationUrl`

- **Purpose**: Controls how values in the `?customization=` URL parameter are resolved and loaded.
- **Main field**: `prefixes` maps logical prefixes to base URLs.
- **Default prefix**: `default` maps to `./customizations/`.
- **Not the same as preserve keys**: This setting does not decide which query keys are preserved. It only controls how customization modules are loaded from `?customization=...`.

Example:

```js
window.config = {
  customizationService: [
    {
      'ohif.customizationUrl': {
        $set: {
          prefixes: {
            default: './customizations/',
            remote: 'https://cdn.example.com/ohif-customizations/',
          },
        },
      },
    },
  ],
};
```

### Using `?customization=`

You can pass one or more customization entries in the URL:

- `?customization=/default/ctAbdomen`
- `?customization=/remote/siteA`
- `?customization=/default/basePack&customization=/default/siteOverrides`

Each entry is normalized to `/prefix/name`, resolved through `ohif.customizationUrl.prefixes`, imported, and then applied.

#### Security considerations (`?customization=`)

Loading customization modules from the URL is **dynamic JavaScript import** in the same browser context as the viewer. Treat it with the same seriousness as any other executable bundle you might load for your deployment.

- **Allowlisted resolution only:** Query values must normalize to `/prefix/name`. The loader rejects values that look like full URLs (with a scheme), rejects path traversal (`..`), rejects unknown `prefix` keys, and rejects unsafe name segments. The final import URL is always built from your configured `ohif.customizationUrl.prefixes` plus a `.js` file under that base—users cannot pass an arbitrary absolute URL as the customization token alone.
- **Your prefixes define the trust boundary:** If a `prefix` maps to a host or path you do not control, or to a directory where untrusted parties can publish files, `?customization=` becomes a way to pull that code into the app. Prefer HTTPS bases, narrow directories, and static hosting of reviewed modules.
- **Invalid entries are skipped:** Invalid entries, resolve failures, failed imports, or modules without a customization payload are skipped with a warning rather than aborting the load, so a single bad entry never blocks the rest of the configuration.
- **`requires` chains:** Dependencies declared in a loaded module are resolved with the **same** policy and validation. A trusted root module can still pull in further modules from the same prefix allowlist—review entire chains you ship.
- **Links and social engineering:** Anyone can share a URL that includes `?customization=...`. Recipients’ browsers will attempt to load the corresponding modules if they pass validation. Combine with normal defenses (user education, authenticated portals, enterprise policies) as you would for any deep link that changes application behavior.

#### What `requires` means

A customization module can declare dependencies via `requires` so dependent modules load first.

Example module shape:

```js
export default {
  customizations: {
    requires: ['/default/basePack', '/remote/sharedTools'],
    global: {
      'someCustomizationKey': {
        $set: true,
      },
    },
  },
};
```

When this module is loaded via `?customization=...`, the loader:

1. Resolves and loads each `requires` dependency first.
2. Applies dependency customizations first.
3. Applies the requested module after dependencies.

This allows packaging layered customizations (base -> shared -> site-specific) without repeating setup in every module.

### Example modules

A URL-loaded module applies its `global` payload as **global customizations** — the same layer as
`window.config`'s `customizationService` entries, but loaded at runtime from `?customization=`. Any
customization key that is read through `customizationService.getCustomization(...)` can therefore be
set this way. The examples below are complete files; drop one under `platform/app/public/customizations/`
(the `default` prefix) and load it with `?customization=<fileName>`.

The shipped [`veterinaryOverlay.js`](https://github.com/OHIF/Viewers/blob/master/platform/app/public/customizations/veterinaryOverlay.js)
demonstrates a fourth scenario — replacing the viewport overlay layout via `viewportOverlay.topLeft` /
`viewportOverlay.topRight`.

#### 1. Site-specific window/level presets

Override the CT presets offered in the window-level menu (key: `cornerstone.windowLevelPresets`).

```js
// platform/app/public/customizations/ctPresets.js  ->  ?customization=ctPresets
export default {
  global: {
    'cornerstone.windowLevelPresets': {
      $set: {
        CT: [
          { id: 'ct-soft-tissue', description: 'Soft tissue', window: '400', level: '40' },
          { id: 'ct-lung', description: 'Lung', window: '1500', level: '-600' },
          { id: 'ct-angio', description: 'Angio', window: '600', level: '300' },
          { id: 'ct-bone', description: 'Bone', window: '2500', level: '480' },
        ],
      },
    },
  },
};
```

#### 2. Predefined measurement labels

Make the viewer prompt for a label from a fixed list whenever a measurement is created
(key: `measurementLabels`).

```js
// platform/app/public/customizations/measurementLabels.js  ->  ?customization=measurementLabels
export default {
  global: {
    measurementLabels: {
      $set: {
        labelOnMeasure: true,
        exclusive: true,
        items: [
          { value: 'Head', label: 'Head' },
          { value: 'Shoulder', label: 'Shoulder' },
          { value: 'Knee', label: 'Knee' },
          { value: 'Toe', label: 'Toe' },
        ],
      },
    },
  },
};
```

#### 3. Read-only segmentation panel

Disable segment editing for a review/read-only deployment (key: `panelSegmentation.disableEditing`).

```js
// platform/app/public/customizations/readOnlySeg.js  ->  ?customization=readOnlySeg
export default {
  global: {
    'panelSegmentation.disableEditing': {
      $set: true,
    },
  },
};
```

Each payload value uses [immutability-helper](https://github.com/kolodny/immutability-helper)
commands (`$set`, `$push`, `$merge`, ...) exactly like `window.config` customizations, so a module can
also append to a list or merge into an existing object rather than replacing it wholesale.

### URL modules, bootstrap, and client-side navigation (intended behavior)

Modules referenced from `?customization=` are loaded when the app applies URL customizations from
`window.location.search`, which happens **once at bootstrap** in the default shell (for example
from app initialization). That is intentional:

- **No automatic refresh on SPA navigation:** Client-side routing may change the visible URL, and
  keys such as `customization` are often **kept in the query string** on purpose (see
  `ohif.preserveCustomizationKeys` above) so bookmarks and deep links stay consistent. That
  preservation does **not** mean the viewer re-imports URL customization modules on every route
  change.
- **Previously loaded modules stay applied:** The service remembers each normalized module key for
  the lifetime of the page. A later call to the same loader path skips modules that were already
  imported, and global payloads from those modules are not rolled back when only the query string
  changes.

If you need a different `?customization=` pack to take effect without a full reload, your
integration must trigger loading explicitly (for example by calling
`customizationService.applyCustomizationUrlSearchParams` or `customizationService.requires` with
the new list). New module keys not seen before can still be loaded that way; unloading or
replacing an already-loaded pack is not supported out of the box.
