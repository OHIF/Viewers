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

## `customizationUrlPrefixes` (app config)

- **Purpose**: Allowlist of prefixes that `?customization=` values may resolve against. The `?customization=` feature is **off until this is configured**.
- **It is an app-config property, not a customization.** Because a customization can itself be loaded from the URL, letting one define prefixes would let it widen its own allowlist — so the allowlist lives on `window.config` directly and is never read from `customizationService`.
- **Prefix model**:
  - The special `default` prefix (no slashes) is used for values **without** a leading slash; the whole value is the file name (e.g. `ctAbdomen`, or `siteA/theme`).
  - Every other prefix **must start and end with a slash** (e.g. `/remote/`) and is matched against the leading `/segment/` of the value.
- **Off by default**: with no `customizationUrlPrefixes` configured, any `?customization=` value is rejected (see below).

Example:

```js
window.config = {
  customizationUrlPrefixes: {
    default: './customizations/',
    '/remote/': 'https://cdn.example.com/ohif-customizations/',
  },
};
```

### Using `?customization=`

You can pass one or more customization entries in the URL:

- `?customization=ctAbdomen` → `default` prefix → `./customizations/ctAbdomen.jsonc`
- `?customization=/remote/siteA` → `/remote/` prefix → `https://cdn.example.com/ohif-customizations/siteA.jsonc`
- `?customization=basePack&customization=siteOverrides`

Each entry is split into a prefix and a name, resolved through `customizationUrlPrefixes`, fetched, parsed as JSONC, and then applied.

#### Security considerations (`?customization=`)

A URL-loaded customization is a **JSONC data file** (JSON with comments / trailing commas). It is fetched and parsed as data — it is **never executed** as code. Executable code (plugins, modes, extensions) loads only through `pluginConfig.json`, never from the customization URL path. This makes `?customization=` far lower risk than loading a JavaScript bundle, but the values still change application behavior, so treat the source directories as trusted configuration.

- **Off until configured, and a hard failure when misused:** With no `customizationUrlPrefixes` set, every `?customization=` value is rejected. A value whose prefix is not on the allowlist **throws and aborts app startup** rather than being silently ignored — so a stray or hostile `?customization=` link on an unconfigured deployment fails loudly instead of partially applying.
- **Allowlisted resolution only:** The loader rejects values that look like full URLs (with a scheme), rejects path traversal (`..`), rejects unknown prefixes, and rejects unsafe name segments. The final fetch URL is always built from your configured `customizationUrlPrefixes` plus a `.jsonc` file under that base—users cannot pass an arbitrary absolute URL as the customization token alone.
- **Your prefixes define the trust boundary:** If a `prefix` maps to a host or path you do not control, or to a directory where untrusted parties can publish files, `?customization=` becomes a way to inject configuration into the app. Prefer HTTPS bases, narrow directories, and static hosting of reviewed files.
- **`requires` chains:** Dependencies declared in a loaded file are resolved with the **same** policy and validation. A trusted root file can still pull in further files from the same prefix allowlist—review entire chains you ship.
- **Links and social engineering:** Anyone can share a URL that includes `?customization=...`. Recipients’ browsers will attempt to load the corresponding modules if they pass validation. Combine with normal defenses (user education, authenticated portals, enterprise policies) as you would for any deep link that changes application behavior.

#### What `requires` means

A customization file can declare dependencies via `requires` so dependent files load first.

Example file shape:

```jsonc
{
  // load these first, then apply this file's `global` payload
  "requires": ["basePack", "/remote/sharedTools"],
  "global": {
    "someCustomizationKey": {
      "$set": true
    }
  }
}
```

When this file is loaded via `?customization=...`, the loader:

1. Resolves and loads each `requires` dependency first.
2. Applies dependency customizations first.
3. Applies the requested module after dependencies.

This allows packaging layered customizations (base -> shared -> site-specific) without repeating setup in every module.

### Example modules

A URL-loaded file applies its `global` payload as **global customizations** — the same layer as
`window.config`'s `customizationService` entries, but loaded at runtime from `?customization=`. Any
customization key that is read through `customizationService.getCustomization(...)` can therefore be
set this way. The examples below are complete files; drop one under `platform/app/public/customizations/`
(the `default` prefix) and load it with `?customization=<fileName>`. Because the files are JSONC, you
can keep `//` comments and trailing commas in them.

The shipped [`veterinaryOverlay.jsonc`](https://github.com/OHIF/Viewers/blob/master/platform/app/public/customizations/veterinaryOverlay.jsonc)
demonstrates a fourth scenario — replacing the viewport overlay layout via `viewportOverlay.topLeft` /
`viewportOverlay.topRight`.

#### 1. Site-specific window/level presets

Override the CT presets offered in the window-level menu (key: `cornerstone.windowLevelPresets`).
`$merge` replaces only the `CT` entry, so presets for other modalities (PT, etc.) are kept.

```jsonc
// platform/app/public/customizations/ctPresets.jsonc  ->  ?customization=ctPresets
{
  "global": {
    "cornerstone.windowLevelPresets": {
      "$merge": {
        "CT": [
          { "id": "ct-soft-tissue", "description": "Soft tissue", "window": "400", "level": "40" },
          { "id": "ct-lung", "description": "Lung", "window": "1500", "level": "-600" },
          { "id": "ct-angio", "description": "Angio", "window": "600", "level": "300" },
          { "id": "ct-bone", "description": "Bone", "window": "2500", "level": "480" }
        ]
      }
    }
  }
}
```

#### 2. Predefined measurement labels

Make the viewer prompt for a label from a fixed list whenever a measurement is created
(key: `measurementLabels`).

```jsonc
// platform/app/public/customizations/measurementLabels.jsonc  ->  ?customization=measurementLabels
{
  "global": {
    "measurementLabels": {
      "$set": {
        "labelOnMeasure": true,
        "exclusive": true,
        "items": [
          { "value": "Head", "label": "Head" },
          { "value": "Shoulder", "label": "Shoulder" },
          { "value": "Knee", "label": "Knee" },
          { "value": "Toe", "label": "Toe" }
        ]
      }
    }
  }
}
```

#### 3. Add a toolbar button

The basic and longitudinal viewers register their toolbar as customizations
(`cornerstone.toolbarButtons` — the button definitions, and `cornerstone.toolbarSections` — the
layout that maps each section to a list of button ids). A module can therefore add a button by
`$push`-ing a definition onto `cornerstone.toolbarButtons` and the button's id onto a section.

The shipped [`smoothRotate.jsonc`](https://github.com/OHIF/Viewers/blob/master/platform/app/public/customizations/smoothRotate.jsonc)
adds a **Smooth Rotate** button to the *More Tools* menu that activates the cornerstone `PlanarRotate`
tool (drag to rotate the image freely, unlike the fixed 90° *Rotate Right*):

```jsonc
// platform/app/public/customizations/smoothRotate.jsonc  ->  ?customization=smoothRotate
{
  "global": {
    "cornerstone.toolbarButtons": {
      "$push": [
        {
          "id": "SmoothRotate",
          "uiType": "ohif.toolButton",
          "props": {
            "type": "tool",
            "icon": "tool-rotate-right",
            "label": "Smooth Rotate",
            "tooltip": "Smooth Rotate (drag to rotate the image freely)",
            "commands": {
              "commandName": "setToolActiveToolbar",
              "commandOptions": { "toolName": "PlanarRotate" }
            },
            "evaluate": "evaluate.cornerstoneTool"
          }
        }
      ]
    },
    "cornerstone.toolbarSections": {
      "MoreTools": { "$push": ["SmoothRotate"] }
    }
  }
}
```

> Because the cornerstone extension registers the default toolbar at the *default* scope and a URL
> module applies at the *global* scope, the `$push` **extends** the built-in buttons rather than
> replacing them. The same pattern works for any tool already in the active tool group.

#### 4. Compose whole capability blocks into a mode

Ownership is split into three layers. **Extensions** export reusable *capability packs* — button
definitions, section layouts and tool lists — under their own namespace (`cornerstone.*`,
`tmtv.*`); the packs carry no mode identity. **Modes** own *composition*: each mode declares which
packs it uses as plain arrays on its instance (`toolbarButtons`, `toolbarSections`,
`toolGroupAdditions`), and the mode route seeds those onto the **Mode** customization scope on
enter — exactly like it seeds `mode.leftPanels` / `mode.rightPanels` from the layout. **Config**
(`?customization=`) re-composes an existing mode through the `mode` phase.

Because composition is per-mode, a JSON module targets a mode with a `mode` phase block keyed by the
mode's id or route name and refines the plain concept keys — pushing a pack's *name* instead of
restating its contents:

```jsonc
{
  "mode": {
    "basic": {
      "toolbarButtons": { "$push": ["cornerstone.segmentationToolbarButtons"] },
      "toolGroupAdditions": {
        "default": { "$push": ["cornerstone.segmentationTools"] }
      }
    }
  }
}
```

There are no `basic.*` / `segmentation.*` / `tmtv.*` keys — `mode.basic` / `mode.viewer` /
`mode.segmentation` already select the mode, and the key is the concept (`toolbarButtons`), the same
way `mode.rightPanels` works for the sidebars. Reserve the `global` phase for values that truly apply
to every mode.

Capability packs exported by the cornerstone extension:

- `cornerstone.toolbarButtons` / `cornerstone.toolbarSections` — the general viewer toolbar.
- `cornerstone.segmentationToolbarButtons` / `cornerstone.segmentationToolbarSections` — the
  segmentation editing buttons and the toolbox section wiring rendered by the
  `panelSegmentationWithTools*` panels.
- `cornerstone.segmentationModeToolbarSections` — a reusable segmentation-mode main toolbar layout.
- `cornerstone.segmentationTools` — the segmentation editing tools (brushes, scissors,
  contour tools) as a `{ passive: [...] }` block for `toolGroupAdditions`.
- `cornerstone.annotationTools` — the measurement/annotation tools as a
  `{ passive: [...] }` block for `toolGroupAdditions`.

The tmtv extension exports its TMTV-specific `tmtv.toolbarButtons` / `tmtv.toolbarSections` packs the
same way.

Two shipped modules demonstrate the pattern:

- [`segmentationEditing.jsonc`](https://github.com/OHIF/Viewers/blob/master/platform/app/public/customizations/segmentationEditing.jsonc)
  (`?customization=segmentationEditing`) adds segmentation editing to the basic and longitudinal
  modes: in `mode` phase blocks keyed by each mode's route name (`basic`, `viewer`) it `$push`es the
  segmentation button/section/tool packs onto that mode's `toolbarButtons` / `toolbarSections` /
  `toolGroupAdditions`, swaps the right panels via `mode.rightPanels`, and enables editing via
  `panelSegmentation.disableEditing`.
- [`segmentationAnnotationTools.jsonc`](https://github.com/OHIF/Viewers/blob/master/platform/app/public/customizations/segmentationAnnotationTools.jsonc)
  (`?customization=segmentationAnnotationTools`) enables the annotation tools inside the
  segmentation mode: in the `mode.segmentation` block it adds a `MeasurementTools` section to the
  primary bar, `$push`es `cornerstone.annotationTools` onto `toolGroupAdditions`, and `$push`es the
  measurement panel onto `mode.rightPanels`.

Each payload value uses [immutability-helper](https://github.com/kolodny/immutability-helper)
commands (`$set`, `$push`, `$merge`, ...) exactly like `window.config` customizations, so a module can
also append to a list or merge into an existing object rather than replacing it wholesale.

> **Every mode's panels are customizable with no opt-in.** A mode's layout declares
> `leftPanels` / `rightPanels` as ordinary **arrays of panel ids** — the standard setup. On mode
> enter the mode route seeds those arrays into the `mode.leftPanels` / `mode.rightPanels`
> customizations at the bottom of the mode scope, then applies the `mode` phase blocks, then
> resolves the sidebars from the final values — so commands compose with the mode's own list and
> global-scope values win by scope precedence.

### URL modules, bootstrap, and client-side navigation (intended behavior)

Modules referenced from `?customization=` are loaded when the app applies URL customizations from
`window.location.search`, which happens **once at bootstrap** in the default shell (for example
from app initialization). That is intentional:

- **No automatic refresh on SPA navigation:** Client-side routing may change the visible URL, and
  keys such as `customization` are often **kept in the query string** on purpose (see
  `ohif.preserveCustomizationKeys` above) so bookmarks and deep links stay consistent. That
  preservation does **not** mean the viewer re-fetches URL customization files on every route
  change.
- **Previously loaded files stay applied:** The service remembers each normalized key for
  the lifetime of the page. A later call to the same loader path skips files that were already
  fetched, and global payloads from those files are not rolled back when only the query string
  changes.

If you need a different `?customization=` pack to take effect without a full reload, your
integration must trigger loading explicitly (for example by calling
`customizationService.applyCustomizationUrlSearchParams` or `customizationService.requires` with
the new list). New module keys not seen before can still be loaded that way; unloading or
replacing an already-loaded pack is not supported out of the box.
