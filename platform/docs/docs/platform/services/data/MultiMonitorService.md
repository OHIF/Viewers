---
sidebar_position: 5
sidebar_label: Multi Monitor Service
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
