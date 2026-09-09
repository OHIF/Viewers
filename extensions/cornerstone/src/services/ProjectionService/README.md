# ProjectionService: MIP / MinIP / AIP for OHIF viewports

This directory owns runtime slab projection. The design keeps one definition of
every mode, one vocabulary normaliser, one engine write path per rendering
lane, and no remembered "MIP is on" state: the truth is always read back from
the rendering engine.

## Layers

| Layer | Where | Responsibility |
|---|---|---|
| Registry | `src/projection/projectionRegistry.ts` | `PROJECTION_MODES` (`none`, `mip`, `minip`, `aip`), `toEngine` / `fromEngine`, `normalizeProjectionModeId`, `getVolumeDiagonal`. Nothing else branches on a mode string. |
| Constants | `src/projection/projectionConstants.ts` | `DEFAULT_SLAB_THICKNESS` (10 mm), `MIN_SLAB_THICKNESS` (engine minimum, 0.05), `SLAB_COMMIT_DELAY_MS` (150), `SLAB_SLIDER_STEP` (1), `FULL_VOLUME_KEYWORD`. |
| Reference | `src/projection/projectionReference.ts` | CPU oracle used by the unit tests (axis-aligned reduce, symmetric slab march, window/level after the max). Never used at runtime. |
| Commands | `commandsModule.ts` `setProjectionMode`, `setSlabThickness` | The only two entry points. `setSlabThickness` reads the current mode back and restates it, so every engine write carries both blend and slab. |
| Service | `ProjectionService.ts` | Guards, stack-to-volume promotion, one render per write, per-layer restore cache, `PROJECTION_CHANGED` with an engine read-back payload, toolbar refresh. |
| Adapter | `../ViewportService/adapter/*` `supportsProjection` / `getProjection` / `setProjection` / `getSlabRange` | The last code before the engine, one implementation per lane. |
| UI | `hooks/useViewportProjection.tsx`, `components/ProjectionMenu/*` | Toggle + debounced slab slider; everything derived from `projectionService.snapshot()` on every event. |
| Config | `utils/getCornerstoneBlendMode.ts`, `CornerstoneViewportService._getSlabThickness` | Hanging-protocol strings go through the registry normaliser; `fullVolume` resolves to the volume diagonal. |

## Slab convention

The user-facing and service/adapter API slab thickness is the **total width in
mm**: the slab spans `focal - t/2 .. focal + t/2` and re-orients with the
camera.

The two rendering lanes store it differently, and the adapters normalise:

- Legacy `VolumeViewport` (vtk.js volume mapper): the slab is two mapper clipping
  planes at `focal +/- value` (`cornerstone Viewport.setOrientationOfClippingPlanes`),
  so the engine value is **half** the width. The legacy adapter writes `t / 2`
  and reads back `2 * value`.
- Native planar viewport (vtk.js image reslice mapper): `slabThickness` is the
  total width (the shader marches to `slabThickness * 0.5` on each side). The
  next adapter writes `t` unchanged.

Hanging-protocol `displaySetOptions.slabThickness` numbers are passed to the
engine **unchanged** (engine-native per lane), exactly as before this feature,
so existing protocols such as the TMTV MIP pane keep rendering identically.
`'fullVolume'` resolves to the volume diagonal on both lanes.

## Off path

Turning projection off restores composite rendering and clears the slab through
an explicit reset, never by writing thickness 0 to the legacy engine (it clamps
0 up to the minimum and leaves the clipping planes in place):

- Legacy: `setBlendMode(COMPOSITE, [actorUID])` then `resetSlabThickness()` when
  no other layer projects, else `setSlabThickness(MINIMUM, [actorUID])`.
- Native: `setDisplaySetPresentation(dataId, { blendMode: COMPOSITE, slabThickness: 0 })`.
  Both fields are needed because COMPOSITE alone maps to a MEAN slab type there.

## Layer identity

A layer is an OHIF `displaySetInstanceUID`. The legacy engine keys actors by a
generated `uid` and stores the volume id in `referencedId`; the adapter resolves
`displaySetInstanceUID -> volumeId -> actor uid` and refuses (`applied: false`)
when it cannot. It never passes an empty filter, which the engine treats as
"every actor". The native engine keys by `dataId === displaySetInstanceUID`.

## Persistence

Projection is stored per viewport and layer inside the service and re-applied
on `VIEWPORT_VOLUMES_CHANGED` (after the mount has applied VOI/colormap/LUT
presentations). Slab thickness is stripped from the LUT presentation capture
(`CornerstoneViewportService._getLutPresentation`) because the legacy engine
reports it viewport-wide and a `setProperties({ slabThickness })` restore would
write it to every layer of a fusion viewport.

## Refusals

`supportsProjection` reports one of: `not-volume`, `volume3d`, `cpu-lane`,
`layer-unresolved`, `volume-not-loaded`. The service adds `no-viewport`,
`no-layer`, `3d-viewport`, `not-reconstructable`, `promotion-failed`,
`write-refused`. A partially loaded volume is refused rather than projected
(the result would look plausible and be wrong); the UI re-evaluates on
`IMAGE_VOLUME_LOADING_COMPLETED`.

## Adding MinIP or AIP to the UI

Flip `uiExposed: true` on the registry row. The menu switches from an on/off
toggle to a mode selector automatically (the registry test pins the count).
