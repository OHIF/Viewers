# @ohif/mode-niivue

## Description

OHIF mode where every image and whole-slide (SM) series renders in a NiiVue
viewport ([`@niivue/nv-ohif`](https://www.npmjs.com/package/@niivue/nv-ohif)).
Views (axial / coronal / sagittal / multiplanar / 3D render) come from the
NiiVue views dropdown; the layout selector offers grid layouts only, each cell
an independent NiiVue viewport. DICOM PDF uses OHIF's PDF viewport and video
plays in the Cornerstone video viewport (NiiVue cannot decode video). SEG /
RTSTRUCT / SR are not displayed yet.

Route: `/niivue?StudyInstanceUIDs=...`

## Author

OHIF, NiiVue

## License

MIT

## Known issues

Tracked against niivue/mono (roadmap issue #269). These need changes in
`@niivue/nv-ohif`, so they wait for a new release candidate; this mode works
around them where it can.

### Upstream (`@niivue/nv-ohif`)

- **SEG / RTSTRUCT / SR are not rendered.** `classifyDisplaySet` sends every
  non-SM DICOMweb series to dcm2niix. This mode keeps those SOP classes out of
  its handlers, so they show as unsupported thumbnails instead of failing in
  dcm2niix. Needs a classifier case for them, then a SEG → labelmap overlay
  (RTSTRUCT and SR later).
- **No mosaic or multiplanar layout options.** The views dropdown offers only
  axial / coronal / sagittal / multiplanar / render. NiiVue already supports
  `mosaicString`, `multiplanarType` (auto / row / column / grid) and
  `showRender`; nv-ohif needs commands and buttons for them, and
  `niivueSetSliceType` must clear `mosaicString` when leaving mosaic.
- **`viewportOptions` are ignored.** `NiivueViewport` always opens in
  multiplanar, so hanging protocols cannot ask for a single orientation
  (`viewportOptions.orientation`) or a 3D render (`viewportType: 'volume3d'`).
  This is why this mode hides the MPR / 3D layout presets.
- **npm `latest` dist-tags are stale** (`@niivue/niivue` 0.69.0,
  `@niivue/nv-ohif` 0.1.0-rc.0, `@niivue/uikit` 1.0.0-rc.1); the 1.0 release
  candidates are only on `next`, so dependencies must pin exact versions.

### OHIF side

- The NiiVue viewport mirrors the active tool of the Cornerstone `default` tool
  group, so the mode still runs basic's `initToolGroups`.
- Cornerstone-only toolbar buttons (`TrackballRotate`, `MoreTools`, `Capture`,
  `Crosshairs`, and the stock `Layout`) are left out; `NiivueCapture`,
  `NiivueCrosshair` and the grid-only `NiivueLayout` replace them.
