---
sidebar_position: 5
sidebar_label: Multi Monitor Service
---

# Multi Monitor Service

The multi-monitor service provides detection, launch and communication support
for multiple monitors or windows/screens within a single monitor.

## Launching

There are two multimonitor configurations predefined, and they can be launched
in two ways.  The first configuration, `multimonitor=split` just splits the main monitor
into two windows.  The other configuration, `multimonitor=2` opens up two windows on
the first and second monitors.

The other launch configuration is choosing whether the first window to launch
will be one of the initial windows, configured just by setting the `&screenNumber=0`
parameter in addition to `multimonitor` parameter, or by not including the screen number.
If the screen number is not included, separate windows will be launched.

All windows can be launched initially, by using either `launchAll` in the query parameters,
or by not including screenNumber.

Thus, some example URLS:

* `http://ohif/?multimonitor=split` - will launch two sub-windows on viewing a study
* `http://ohif/viewer?multimonitor=2&studyInstanceUIDs=1.2.3&screenNumber=0&launchAll`
  - will launch in two monitors, launching all the screens (this should already be on one screen)

## Refresh, Close and Open
If you refresh the base/original window, then all the other windows will also
refresh.  However, you can safely refresh any single other window, and on the next
command to the other windows, it will re-create the other window links without
losing content in the other windows.  You can also close any other window and
it will be reopened the next time you try to call to it.

## Executing Commands
The MultiMonitorService adds the ability to run commands on other specified windows.
This allows opening up a study on another window without needing to refresh
it's contents.  The command below shows an example of how this can be done:

```javascript
{
  commandName: 'multimonitor',
  commandOptions: {
  commands: [
    {
      commandName: 'loadStudy',
   },
   {
      commandName: 'setHangingProtocol',
      commandOptions: {
      protocolId: '@ohif/mnGrid',
```
