---
sidebar_position: 14
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

```bash
yarn cs3d:checkout feat/multires-voxel-manager-base
yarn cs3d:install
yarn cs3d:build
yarn cs3d:link
```

Then start OHIF as usual. To go back to the published packages, run `yarn cs3d:unlink`.

## Running it in CI

Add this line to the body of your pull request, outside every code block and every HTML
comment:

```
CS3D_REF: feat/multires-voxel-manager-base
```

The branch must live in the `cornerstonejs/cornerstone3D` repository. A branch on a fork
is rejected.

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
