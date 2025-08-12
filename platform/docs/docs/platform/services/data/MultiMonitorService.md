---
sidebar_position: 5
sidebar_label: Multi Monitor Service
title: Multi Monitor Service
summary: Documentation for OHIF's MultiMonitorService, which provides basic support for opening and managing multiple viewer windows, including split-screen options and cross-window communication capabilities.
---


# Multi Monitor Service

::: info

We plan to enhance this service in the future. Currently, it offers a basic implementation of multi-monitor support, allowing you to manually open multiple windows on the same monitor. It is not yet a full multi-monitor solution!

:::




The multi-monitor service provides detection, launch and communication support
for multiple monitors or windows/screens within a single monitor.

:::info

The multi-monitor service is currently applied via configuration file.

```js
customizationService: ['@ohif/extension-default.customizationModule.multimonitor'],
```

:::



## Configurations
The service supports two predefined configurations:

1. **Split Screen (`multimonitor=split`)**
   Splits the primary monitor into two windows.

2. **Multi-Monitor (`multimonitor=2`)**
   Opens windows across separate physical monitors.

### Launch Methods
- Specify `&screenNumber=0` to designate the first window explicitly.
- Omit `screenNumber` to let the service handle window assignments dynamically.
- Use `launchAll` in the query parameters to launch all configured screens simultaneously.

#### Example URLs:
- **Split Screen:**
  `http://viewer.ohif.org/.....&multimonitor=split`
  Splits the primary monitor into two windows when a study is viewed.

- **Multi-Monitor with All Screens:**
  `http://viewer.ohif.org/.....&multimonitor=2&screenNumber=0&launchAll`
  Launches two monitors and opens all configured screens.

---

## Configuration File Setting

The `multimonitor` configuration setting in the
[configuration file](../../../configuration/configurationFiles.md) specifies various
properties for each of the OHIF windows opened when multimonitor is launched. The setting is
an array of properties for each [configuration](#configurations) defined.
Each entry in the array is an object with the following properties.

- `id`: The id for the array item. Typically it corresponds to one of the
[configurations](#configurations) (e.g. `split` or `2`)
- `test`: A function that takes a single object argument containing the property
`multimontior` (i.e. the [configuration](#configurations)). The function should return `true`
if this array entry should be applied to the [configuration](#configurations).
- `screens`: An array of objects that define each of the OHIF screens to be opened

Each `screen` array entry above has the following properties.

- `id`: The unique screen identifier (e.g. `ohif0` or `radScreen0`)
- `screen`: The index of the physical screen. For the `split` configuration this can
be `null` because there is no specific physical screen for it.
- `location`: The normalized top, left position and size of the window
(i.e. `x`, `y`, `width`, `height`) relative to the physical screen for the window
- `options` Standard comma delimited string of popup
[window options](https://developer.mozilla.org/en-US/docs/Web/API/Window/open#windowfeatures).

Below is a snippet from a configuration file for multimonitor.
```
  ...
  multimonitor: [
    {
      id: 'split',
      test: ({ multimonitor }) => multimonitor === 'split', // applies to the split multimonitor configuration
      screens: [
        {
          id: 'ohif0',
          screen: null,
          location: {
            width: 0.5,
            height: 1,
            left: 0,
            top: 0,
          },
          options: 'location=no,menubar=no,scrollbars=no,status=no,titlebar=no',
        },
        {
          id: 'ohif1',
          screen: null,
          location: {
            width: 0.5,
            height: 1,
            left: 0.5,
            top: 0,
          },
          options: 'location=no,menubar=no,scrollbars=no,status=no,titlebar=no',
        },
      ],
    },

    {
      id: '2',
      test: ({ multimonitor }) => multimonitor === '2', // applies to the `2` multimonitor configuration
      screens: [
        {
          id: 'ohif0',
          screen: 0,
          location: {
            width: 1,
            height: 1,
            left: 0,
            top: 0,
          },
          options: 'fullscreen=yes,location=no,menubar=no,scrollbars=no,status=no,titlebar=no',
        },
        {
          id: 'ohif1',
          screen: 1,
          location: {
            width: 1,
            height: 1,
            left: 0,
            top: 0,
          },
          options: 'fullscreen=yes,location=no,menubar=no,scrollbars=no,status=no,titlebar=no',
        },
      ],
    },
  ],
  ...
```

## Behavior

### Refresh, Close and Open
If you refresh the base/original window, then all the other windows will also
refresh.  However, you can safely refresh any single other window, and on the next
command to the other windows, it will re-create the other window links without
losing content in the other windows.  You can also close any other window and
it will be reopened the next time you try to call to it.


## Executing Commands
The MultiMonitorService adds the ability to run commands on other specified windows.
This allows opening up a study on another window without needing to refresh
it's contents.  The command below shows an example of how this can be done:
