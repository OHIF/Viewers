---
sidebar_position: 10
sidebar_label: Projection Service
title: Projection Service
summary: Documentation for OHIF's ProjectionService, which provides maximum intensity projection (MIP) with a user-controlled slab thickness on volume viewports, the two commands that drive it, and the events it publishes.
---

# Projection Service

## Overview

`ProjectionService` adds slab projection to planar volume viewports. With
projection enabled, every pixel shows the **maximum** raw voxel value found
along the viewing direction inside a slab of finite thickness centred on the
current slice. Window/level and colormaps are applied afterwards to the winning
value, exactly as for a single slice.

The service ships a **MIP** mode. Minimum (MinIP) and average (AIP)
projections are already defined in the projection registry and can be exposed
in the UI by flipping one flag.

Key properties:

- The slab is finite, user-controllable, and re-orients with the camera.
- The slab thickness is always the **total width in millimetres** (planes at
  `focal ± thickness / 2`), whichever rendering path is active.
- Projection requires the full volume: a partially loaded volume is refused
  and the controls re-enable when loading completes.
- Turning projection off restores the previous non-projected rendering exactly.
- A 2D stack viewport on reconstructable data is promoted to a volume viewport
  on first enable; its rotation and flip are preserved.
- Projection is per layer: in a PET/CT fusion only the selected layer projects.

## UI

The viewport action corner (top left, next to the orientation menu) shows a
projection button whenever the viewport's data is reconstructable. The menu
holds an on/off switch and a slab-thickness slider (1 mm steps, capped at the
volume diagonal). The slider commits once per drag; every value shown is read
back from the rendering engine.

## Commands

| Command | Options | Description |
| --- | --- | --- |
| `setProjectionMode` | `{ viewportId?, modeId, slabThickness?, displaySetInstanceUID? }` | Sets the projection mode (`'none'`, `'mip'`, `'minip'`, `'aip'`) of a viewport layer. Defaults: the active viewport, the foreground layer, the last used or default (10 mm) thickness. |
| `setSlabThickness` | `{ viewportId?, slabThickness, displaySetInstanceUID? }` | Sets the total slab width in mm, restating the current mode read back from the engine. When nothing projects, the value is stored for the next enable. |

Both commands return a result: `{ applied: true, projection }` or
`{ applied: false, reason, message }`, where `reason` is one of
`no-viewport`, `no-layer`, `3d-viewport`, `not-reconstructable`,
`promotion-failed`, `write-refused`, `not-volume`, `volume3d`, `cpu-lane`,
`layer-unresolved`, `volume-not-loaded`.

```js
commandsManager.run('setProjectionMode', { viewportId: 'mpr-axial', modeId: 'mip' });
commandsManager.run('setSlabThickness', { viewportId: 'mpr-axial', slabThickness: 25 });
commandsManager.run('setProjectionMode', { viewportId: 'mpr-axial', modeId: 'none' });
```

## API

| Method | Description |
| --- | --- |
| `getProjection({ viewportId?, displaySetInstanceUID? })` | `{ blendOp, slabThickness }` read back from the engine, or `undefined`. |
| `supportsProjection(target)` | `{ supported: true }` or `{ supported: false, reason }`. |
| `getSlabRange(target)` | `{ min, max }` in mm; `max` is the volume bounding diagonal. |
| `snapshot(target)` | Everything the UI needs in one read: projection, mode id, support, slab range. |

## Events

| Event | Payload | Description |
| --- | --- | --- |
| `PROJECTION_CHANGED` | `{ viewportId, displaySetInstanceUID, projection, support }` | Fired after every projection write, after a restore on viewport rebuild, and when a layer's volume finishes loading. `projection` and `support` are read back from the engine, never echoed from the request. |

## Hanging protocols

Protocol `displaySetOptions` keep working unchanged:

```js
displaySets: [
  {
    id: 'ptDisplaySet',
    options: { blendMode: 'MIP', slabThickness: 'fullVolume' },
  },
];
```

`blendMode` accepts `MIP`, `MinIP`, `AIP` (and the legacy `avg`);
unknown strings throw. `slabThickness` accepts a number or `'fullVolume'`
(the volume diagonal). Protocol numbers are passed to the engine unchanged,
so existing protocols render identically.

## Hook

`useViewportProjection(viewportId, { displaySetInstanceUID? })` returns
`isProjecting`, `modeId`, `slabThickness`, `slabRange`, `supported`,
`unsupportedReason`, `modes`, `setMode`, `setSlabThickness`, all derived from
the engine on every relevant event.
