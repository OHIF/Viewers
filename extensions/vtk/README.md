# @ohif/extension-vtk

![npm (scoped)](https://img.shields.io/npm/v/@ohif/extension-vtk.svg?style=flat-square)

<!-- TODO: Simple image or GIF? -->

#### Index

Extension Id: `vtk`

- [Commands Module](#commands-module)
- [Toolbar Module](#toolbar-module)
- [Viewport Module](#viewport-module)

## Commands Module

| Command Name           | Description | Store Contexts |
| ---------------------- | ----------- | -------------- |
| `axial`                |             | viewports      |
| `coronal`              |             | viewports      |
| `sagittal`             |             | viewports      |
| `enableRotateTool`     |             | viewports      |
| `enableCrosshairsTool` |             | viewports      |
| `enableLevelTool`      |             | viewports      |
| `mpr2d`                |             | viewports      |

## Toolbar Module

Our toolbar module contains definitions for:

- `Crosshairs`
- `WWWC`
- `Rotate`

All use the `ACTIVE_VIEWPORT::VTK` context.

## Viewport Module

Our Viewport wraps [OHIF/react-vtkjs-viewport][react-viewport] and is connected
the redux store. This module is the most prone to change as we hammer out our
Viewport interface.

## Resources

### Repositories

- [OHIF/react-vtkjs-viewport][react-viewport]

<!--
  Links
  -->

<!-- prettier-ignore-start -->
[react-viewport]: https://github.com/OHIF/react-vtkjs-viewport
<!-- prettier-ignore-end -->
