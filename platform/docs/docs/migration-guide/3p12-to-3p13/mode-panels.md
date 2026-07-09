---
sidebar_position: 10
sidebar_label: Mode panel lists & customization
title: 'Mode panel lists are standard customizations'
---

# Mode panel lists are standard customizations

3.13 lets a mode's sidebars be modified at runtime through the customization
service — for **every** mode, with nothing to opt into. Modes declare their
panels the standard way, as literal arrays in the layout:

```ts
props: {
  leftPanels: ['@ohif/extension-default.panelModule.seriesList'],
  rightPanels: ['@ohif/extension-cornerstone.panelModule.panelMeasurement'],
}
```

On mode enter the mode route layers the mode scope bottom-up and only then
resolves the sidebars:

1. the mode scope is reset;
2. the layout's panel arrays are seeded as the standard `mode.leftPanels` /
   `mode.rightPanels` customizations (the bottom layer of the mode scope);
3. the app config / URL `mode` phase blocks apply — the general `*` block, then
   the block keyed by the entered mode's id / route name;
4. the sidebars resolve from the final `mode.leftPanels` / `mode.rightPanels`
   values (global-scope customizations, as always, win by scope precedence).

## Customizing a mode's panels

Because the mode's own list is already in the customization service when the
phase blocks apply, a `?customization=` module (or `window.config`
customization) targets the standard keys in a `mode` phase block — and
immutability-helper commands compose with the mode's own list:

```jsonc
{
  "mode": {
    // Replace the right sidebar in the longitudinal mode (route name `viewer`)
    "viewer": {
      "mode.rightPanels": {
        "$set": [
          "@ohif/extension-cornerstone.panelModule.panelSegmentationWithToolsLabelMap",
          "@ohif/extension-measurement-tracking.panelModule.trackedMeasurements"
        ]
      }
    },
    // Append a panel in the segmentation mode
    "segmentation": {
      "mode.rightPanels": {
        "$push": ["@ohif/extension-cornerstone.panelModule.panelMeasurement"]
      }
    },
    // Or change every mode at once with the general block
    "*": {
      "mode.leftPanels": { "$push": ["@ohif/extension-example.panelModule.myPanel"] }
    }
  }
}
```

See the shipped
[`segmentationEditing.jsonc`](https://github.com/OHIF/Viewers/blob/master/platform/app/public/customizations/segmentationEditing.jsonc)
and
[`segmentationAnnotationTools.jsonc`](https://github.com/OHIF/Viewers/blob/master/platform/app/public/customizations/segmentationAnnotationTools.jsonc)
modules for complete worked examples.

## Migration notes

- **Existing modes need no changes.** Literal panel arrays are the standard
  form and are now also the customizable form.
- **The per-mode panel-list names from early 3.13 betas are gone.** If you
  wrote a customization against `basic.leftPanels`, `longitudinal.rightPanels`,
  `segmentation.rightPanels`, or `tmtv.leftPanels`, move it to the standard
  `mode.leftPanels` / `mode.rightPanels` keys inside a `mode` phase block keyed
  by the mode's route name (see above).
- A layout may still set a panel value to a customization *name* registered by
  one of the mode's extensions; the route resolves the name when seeding
  `mode.leftPanels` / `mode.rightPanels`. This is only needed when several
  modes should share one registered list.
