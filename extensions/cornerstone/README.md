# @ohif/extension-cornerstone

![npm (scoped)](https://img.shields.io/npm/v/@ohif/extension-cornerstone.svg?style=flat-square)

This extension adds support for viewing and manipulating 2D medical images via a
viewport. The underlying implementation wraps the
`cornerstonejs/react-cornerstone-viewport`, and provides basic commands and
toolbar buttons for common actions.

<!-- TODO: Simple image or GIF? -->

#### Index

Extension Id: `cornerstone`

- [Commands Module](#commands-module)
- [Toolbar Module](#toolbar-module)
- [Viewport Module](#viewport-module)

## Commands Module

This extensions includes the following `Commands` and `Command Definitions`.
These can be registered with `@ohif/core`'s `CommandManager`. After registering
the commands, they can be bound to `hotkeys` using the `HotkeysManager` and
listed in the `UserPreferences` modal.

You can read more about [`Commands`][docs-commands], [`Hotkeys`][docs-hotkeys],
and the [`UserPreferences` Modal][docs-userprefs] in their respective locations
in the OHIF Viewer's documentation.

| Command Name                 | Description                             | Store Contexts |
| ---------------------------- | --------------------------------------- | -------------- |
| `rotateViewportCW`           |                                         | viewports      |
| `rotateViewportCCW`          |                                         | viewports      |
| `invertViewport`             |                                         | viewports      |
| `flipViewportVertical`       |                                         | viewports      |
| `flipViewportHorizontal`     |                                         | viewports      |
| `scaleUpViewport`            |                                         | viewports      |
| `scaleDownViewport`          |                                         | viewports      |
| `fitViewportToWindow`        |                                         | viewports      |
| `resetViewport`              |                                         | viewports      |
| clearAnnotations             | TODO                                    |                |
| next/previous Image          | TODO                                    |                |
| first/last Image             | TODO                                    |                |
| `nextViewportDisplaySet`     |                                         |                |
| `previousViewportDisplaySet` |                                         |                |
| `setToolActive`              | Activates tool for primary button/touch |                |

## Toolbar Module

Our toolbar module contains definitions for:

- `StackScroll`
- `Zoom`
- `Wwwc`
- `Pan`
- `Length`
- `Angle`
- `Reset`
- `Cine`

All use the `ACTIVE_VIEWPORT::CORNERSTONE` context.

## Viewport Module

Our Viewport wraps [cornerstonejs/react-cornerstone-viewport][react-viewport]
and is connected the redux store. This module is the most prone to change as we
hammer out our Viewport interface.

## Tool Configuration

Tools can be configured through extension configuration using the tools key:

```js
  ...
  cornerstoneExtensionConfig: {
    tools: {
      ArrowAnnotate: {
        configuration: {
          getTextCallback: (callback, eventDetails) => callback(prompt('Enter your custom annotation')),
        },
      },
    },
  },
  ...
```

## Annotate Tools Configuration

*We currently support one property for annotation tools.*

### Hide handles
This extension configuration allows you to toggle on/off handle rendering for all annotate tools:

```js
  ...
  cornerstoneExtensionConfig: {
    hideHandles: true,
  },
  ...

## Resources

### Repositories

- [cornerstonejs/react-cornerstone-viewport][react-viewport]
- [cornerstonejs/cornerstoneTools][cornerstone-tools]
- [cornerstonejs/cornerstone][cornerstone]

<!--
  Links
  -->

<!-- prettier-ignore-start -->
[docs-commands]: https://www.com
[docs-hotkeys]: https://www.com
[docs-userprefs]: htt
[react-viewport]: https://github.com/cornerstonejs/react-cornerstone-viewport
[cornerstone-tools]: https://github.com/cornerstonejs/cornerstoneTools
[cornerstone]: https://github.com/cornerstonejs/cornerstone
<!-- prettier-ignore-end -->
