---
sidebar_position: 14
sidebar_label: Multi-resolution volumes
title: Multi-resolution volumes and Cornerstone3D 5.17
---

# Multi-resolution volumes and Cornerstone3D 5.17

OHIF 3.14 uses Cornerstone3D 5.17, which adds multi-resolution volume textures. Some changes
reach every deployment, also a deployment that keeps lossy downsampling off. Each section
below gives the change, and how to get the 3.13 behaviour back.

See [Testing the Multi-Resolution Volume Work](../../development/multiresolution-testing.md)
for the design and the test steps.

## Volume load order and the `mpr` protocol

**Change.** The cornerstone extension sets the retrieve stages of a volume to the
Cornerstone3D `coarseInterleavedRetrieveStages`. These stages load every 64th image first,
and copy each image to the empty frames around it. A reformat then shows no gray lines while
the volume loads. The `mpr` protocol no longer sets `imageLoadStrategy: 'nth'`, so it uses
these stages.

In 3.13, the volume stages were `interleavedRetrieveStages`, and `mpr` used `nth`.

**Effect.** The load order changes for every deployment. The first images show at a coarse
depth resolution, and then refine. The new stages have no lossy (thumbnail) pass. An HTJ2K
server therefore loses its fast lossy first pass.

**To get the 3.13 volume stages back**, set `volumeRetrieveOptions` in the data source
configuration. A protocol without an `imageLoadStrategy` then uses the 3.13 stages, with the
lossy first pass:

```js
configuration: {
  volumeRetrieveOptions: 'interleavedRetrieveStages',
}
```

See [Data Source: volumeRetrieveOptions](../../configuration/configurationFiles.md#data-source-volumeretrieveoptions).

**To get the 3.13 `mpr` protocol back**, register a copy of `mpr` with the `nth` strategy,
for example in the `onModeEnter` of your mode. A protocol with a strategy does not use the
volume stages.

```js
const mpr = hangingProtocolService.getProtocolById('mpr');
hangingProtocolService.addProtocol('mpr', { ...mpr, imageLoadStrategy: 'nth' });
```

The other OHIF protocols (`fourUp`, `main3D`, `mprAnd3DVolumeViewport`, `only3D`,
`primary3D`, `primaryAxial` and `tmtv`) keep their strategies, and do not change.

## The Cornerstone3D fidelity label

**Change.** Cornerstone3D shows the label "Transient Low Fidelity" in red while a volume
viewport shows data that is not the full data, for example while an MPR volume loads.

**Effect.** All deployments show the label. The label (`fi-root`) has a z-index of 1000,
which is above the OHIF menu layer, so it can cover a menu and take a click.

**Do not turn the label off.** Cornerstone3D has a `dangerouslyDisableFidelityIndicator`
option, but OHIF does not set the option. Without an indicator, a user cannot tell a
replicated or reduced view from the full data.

The label is a temporary solution. An OHIF fidelity indicator,
[OHIF/Viewers#6413](https://github.com/OHIF/Viewers/pull/6413), will replace the label. That
pull request is intended to merge before the 3.14 release. Its design still needs
discussion, so this section stays in the migration notes until the OHIF indicator merges.

## Cornerstone3D 5.12 to 5.17 API changes

OHIF 3.14 moves from Cornerstone3D 5.12.0 to 5.17.0. These changes can break an extension:

- `volume.vtkOpenGLTexture` is now a getter, and it can return `undefined`. A volume can
  hold more than one texture set, for the full data and for a reduced representation.
- `RenderingCapabilities.webgl2` is removed. Use `RenderingCapabilities.webgl`.
- Code that copied the 3.13 `updateVolumeData` command throws. To mark a computed volume as
  changed, call `volume.modified()`. The call marks the image data and every texture set as
  changed. Do not call `setUpdatedFrame` on each frame of `volume.vtkOpenGLTexture`.

**Before (3.13):**

```js
const { imageData, vtkOpenGLTexture } = volume;
const numSlices = imageData.getDimensions()[2];
for (let i = 0; i < numSlices; i++) {
  vtkOpenGLTexture.setUpdatedFrame(i);
}
imageData.modified();
```

**After (3.14):**

```js
volume.modified();
```

To mark one frame as changed, call `volume.markFrameModified(frameIndex)`.

For the other changes, read the Cornerstone3D release notes of 5.13 to 5.17.

## Lossy downsampling and GPU settings presets

**Change.** The app config has a new `lossyDownsampling` option, and the cornerstone extension
has a new `cornerstone.gpuSettingsPreset` customization. With `lossyDownsampling.final`
on, a volume viewport reduces its texture to fit the preset.

**Effect.** `config/default.js` and the Docker recipes keep `final` off, so a production
build draws the full-resolution texture, as in 3.13. `config/dev.js`, `config/netlify.js`
and `config/e2e.js` turn `final` on, and select the `medium` preset (8 GB). A
`?customization=gpu/<preset>` URL selects a different preset. Without a preset, Cornerstone3D
uses `high` (32 GB), and a device of the middle class can crash under that preset.

**To turn final downsampling on in a deployment**, set `lossyDownsampling: { final: true }`,
and select a preset that the devices can hold:

```js
customizationService: {
  bootstrap: { 'cornerstone.gpuSettingsPreset': 'medium' },
},
```

See [`lossyDownsampling`](../../configuration/configurationFiles.md) and
[Select the GPU settings preset](../../platform/services/customization-service/specificCustomizations.md#5-select-the-gpu-settings-preset).
