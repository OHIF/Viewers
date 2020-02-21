# @ohif/dicom-segmentation

![npm (scoped)](https://img.shields.io/npm/v/@ohif/dicom-segmentation.svg?style=flat-square)

This extension adds support to view and navigate the segments available in the DICOM SEG,
allowing control over visibility of a given segment and providing metadata about the segment(s).

<!-- TODO: Simple image or GIF? -->

#### Index

Extension Id: `com.ohif.dicom-segmentation`

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
