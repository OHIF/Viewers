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
          strict: false,
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
