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

## `segmentation.store.*` (DICOM SEG export encoding)

These customizations control how the `@ohif/extension-cornerstone-dicom-seg` extension
encodes a DICOM SEG when it is **stored or downloaded**, and are read when a SEG is
generated.

| Key | Values | Default | Controls |
| --- | --- | --- | --- |
| `segmentation.store.defaultMode` | `'labelmap'` \| `'bitmap'` | `'labelmap'` | SEG SOP Class |
| `segmentation.store.transferSyntaxUID` | a transfer-syntax UID string | RLE Lossless (`1.2.840.10008.1.2.5`) | PixelData encoding |

- **`segmentation.store.defaultMode`**
  - `'labelmap'` → Label Map Segmentation Storage (`1.2.840.10008.5.1.4.1.1.66.7`). One
    multi-valued frame per slice. Added to DICOM in 2024, so many PACS/viewers do not
    accept it yet. **This is the OHIF default.**
  - `'bitmap'` → (binary) Segmentation Storage (`1.2.840.10008.5.1.4.1.1.66.4`). One frame
    per segment; broadly compatible with existing back ends and viewers. Opt in via
    customization when needed.
- **`segmentation.store.transferSyntaxUID`**
  - Default → RLE Lossless (`1.2.840.10008.1.2.5`, compressed). Set by
    `getSegmentationSaveOptions` in `@ohif/extension-cornerstone-dicom-seg` and registered
    as an extension customization — no app config required.
  - `1.2.840.10008.1.2.1` → Explicit VR Little Endian (**uncompressed**). Opt in via
    customization for back ends that reject compressed SEG PixelData.

> OHIF's effective default is **Label Map + RLE Lossless (compressed)**. Customizations
> (or per-data-source `configuration.segmentation.store`) are only needed to switch to
> bitmap and/or uncompressed.

### URL-loaded files (recommended)

Two ready-made public customization files ship under
`platform/app/public/customizations/segmentation/`, so a user can flip either default
straight from the URL (requires `customizationUrlPrefixes.default` to be configured — it
is in the `dev` / `netlify` configs):

| File | `?customization=` value | Effect |
| --- | --- | --- |
| `segmentation/uncompressed.jsonc` | `segmentation/uncompressed` | Explicit VR Little Endian instead of RLE |
| `segmentation/binary.jsonc` | `segmentation/binary` | Binary SEG (66.4) instead of Label Map (66.7) |

They are independent and combine, so you can apply both at once:

```
http://host/viewer?customization=segmentation/uncompressed&customization=segmentation/binary
```

Each file just `$set`s one key in the `global` phase, e.g. `segmentation/binary.jsonc`:

```jsonc
{
  "global": {
    "segmentation.store.defaultMode": { "$set": "bitmap" }
  }
}
```

The remaining forms below set the same keys directly in `window.config` instead of via the
URL.

### Store an uncompressed SEG instead of the compressed default

```js
window.config = {
  customizationService: [
    {
      'segmentation.store.transferSyntaxUID': {
        $set: '1.2.840.10008.1.2.1', // Explicit VR Little Endian (uncompressed)
      },
    },
  ],
};
```

### Store a binary SEG (66.4) instead of the default Label Map (66.7)

```js
window.config = {
  customizationService: [
    {
      'segmentation.store.defaultMode': { $set: 'bitmap' },
    },
  ],
};
```

### Per data source override

A data source may override the app-wide default for one back end only, under
`configuration.segmentation.store`. **The data source value wins over the customization
default**, so different back ends can pick the SEG encoding they support:

```js
window.config = {
  // App-wide default (optional): Label Map + RLE unless set here.
  customizationService: [
    { 'segmentation.store.defaultMode': { $set: 'labelmap' } },
  ],
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'myPacs',
      configuration: {
        // ...wado/qido/stow roots...
        segmentation: {
          store: {
            defaultMode: 'bitmap', // this PACS only accepts binary SEG
            transferSyntaxUID: '1.2.840.10008.1.2.1', // and only uncompressed
          },
        },
      },
    },
  ],
};
```

When storing, the override is resolved against the data source being written to; for
download (no target data source) the active data source's override applies.
