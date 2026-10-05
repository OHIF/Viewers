---
sidebar_position: 15
sidebar_label: Multi-Resolution Volume Testing
title: Testing the Multi-Resolution Volume Work
summary: How to run OHIF against the Cornerstone3D multi-resolution volume branch, and what to check.
---

# Testing the Multi-Resolution Volume Work

Cornerstone3D branch `feat/multires-voxel-manager-base` gives a volume more than one
resolution of its voxels, and it lets a viewport draw the resolution that the device can
hold. This page says how to run OHIF against that branch, and what to look at.

Read [CS3D Integration Testing](./cs3d-integration.md) first. It describes the
`CS3D_REF` mechanism and the local link scripts in full. This page adds only what is
specific to the multi-resolution work.

## What the branch changes

A volume of many images cannot always fit in one GPU texture. A series of 2464 images
exceeds the limit of 2048 voxels on one axis that every known device states, so before
this branch such a series could not be drawn at all on some devices, and the allocation
failed.

The branch changes three things that a tester can see:

- **A volume can hold several representations of its voxels.** One is the data as the
  loader delivered it. Another is a box average of that data on a coarser grid.
- **A viewport chooses the representation that its device can hold.** The choice is made
  once, when the viewport adds its actor, and it is read from a capability profile.
- **A reduced representation follows the load.** The loader delivers its frames over
  time, and each delivery redoes the part of the reduced data that the frame changed.

## Running it locally

This repository states `pnpm` in the `packageManager` field of `package.json`, so every
command uses `pnpm`. A command that starts with `yarn` fails with exit code 1 and the
message `This project is configured to use pnpm`.

```bash
pnpm cs3d:checkout feat/multires-voxel-manager-base
pnpm cs3d:install
pnpm cs3d:build
pnpm cs3d:link
```

Then start OHIF with `pnpm dev`. To go back to the published packages, run
`pnpm cs3d:unlink`.

## Running it in CI

Add this line to the body of your pull request, outside every code block and every HTML
comment:

```
CS3D_REF: feat/multires-voxel-manager-base
```

The branch must live in the `cornerstonejs/cornerstone3D` repository. A branch on a fork
is rejected.

## Choosing a class of GPU

A viewport reduces its texture to fit the device. To see a reduction on a device that
needs none, state a smaller class of GPU with the `?customization=` URL parameter. The
viewer ships one file for each class under
`platform/app/public/customizations/gpu/`:

| Value | Texture edge | Texture memory | Use |
| ----- | ------------ | -------------- | --- |
| `gpu/low-tablet` | 256 | 1 GB | Almost every volume reduces. The reduction is easy to see. |
| `gpu/low` | 2048 | 8 GB | The memory causes the reduction, and not the edge. |
| `gpu/medium` | 2048 | 16 GB | A device of the middle class. |
| `gpu/high` | 2048 | 32 GB | The default, and the best real device. |
| `gpu/high-texture-4096` | 4096 | 32 GB | A control, and not a real device. |

An example URL:

```
http://localhost:3000/viewer?StudyInstanceUIDs=<uid>&hangingProtocolId=mpr&customization=gpu/low-tablet
```

Each file sets the `cornerstone.gpuCapabilityProfile` customization. The app config must
allow the prefix: `config/dev.js` sets `customizationUrlPrefixes` and `config/default.js`
does not, so a build that serves `config/default.js` rejects the parameter.

**`gpu/high-texture-4096` states an edge of 4096, and no known WebGL device holds an edge
above 2048.** A real device can therefore fail to allocate the texture. The profile is the
control of the demonstration: a series of up to 4096 images reduces nothing under
`gpu/high-texture-4096` and reduces under `gpu/high`, which shows that the reduction comes
from the limit of the device and not from a defect. Do not state the profile in
production.

## What to check

**The viewer opens a large series.** Load a CT series of more than 2048 images. Before
this branch a device with a limit of 2048 could not allocate the texture. The series must
now display.

**A reformat holds no band and no black line.** Look at the sagittal view and at the
coronal view while the series loads. Each one must refine as the data arrives. A block of
one image repeated down the view, or a black line across it, is a defect. Report it with
the series and the number of images.

**The measurements do not change.** A viewport reads the full-resolution voxels for a
measurement, whatever resolution it draws. A length, an area and a mean value must be the
same as before the branch.

**A segmentation still aligns with its images.** A labelmap keeps its own resolution, and
a reduced CT under it must not shift it.

## What this branch does not do

**The resolution of a viewport does not change while a volume loads.** The device sets
the resolution when the viewport adds its actor, and one resolution is used for the whole
load. The values refine as the data arrives, so a reformat gets sharper, but the grid does
not get finer. A ladder of grids is later work.

**Nothing probes the device.** The capability profile is a stated value and not a
measurement, so a deployment that states a profile larger than the device holds gets an
allocation failure. A probe is later work.

## Where the design is written

The Cornerstone3D repository holds the design of this work:

- `packages/docs/docs/concepts/cornerstone-core/compositeVoxelManager.md` describes how a
  volume holds more than one representation of its voxels.
- `packages/docs/docs/concepts/cornerstone-core/volumeRenderStrategy.md` describes how a
  viewport builds its strategies, how one render chooses among them, and how a derived
  representation follows the load.
