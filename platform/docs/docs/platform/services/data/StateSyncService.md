---
sidebar_position: 8
sidebar_label: State Sync Service
---

# State Sync Service

## Overview
The state sync service is designed to allow short and long term memory of things such as
annotations applied, last annotation state, hanging protocol viewport state,
window level etc.  This allows for better interaction with things like navigation
between hanging protocols, ensuring that the previously displayed layouts
can be redisplayed after returning to a given hanging protocol.

Currently, all the state sync service configurations have one of the following two
lifetimes.  See the mode description for general information on the mode lifetime.

* Application load - when the application is restarted, the state is lost
* `clearOnModeExit` - which stores state until the mode onModeExit is called, and then throws away the remaining state.  This is useful for mode specific information.

### TODO work - add more storage locations
It is expected to add a few more storage locations, which will store to various
locations on updates:

* User specific server store - to store things between application restarts at the user level
* Browser state store - to store things in the browser local state, to recover after crashing.
* Study specific server store - to store things relevant to a given study between application restarts, on the server.

## Events

Currently the service does not fire events.

## API

- `register`: to create a new named state storage
- `reduce`: to apply a set of changes to several states at once
- `getState`: to retrieve the current state
- `onModeExit`: clears the states configured as clearOnModeExit states

### register
The register call is typically added to an extension to create a new
syncable state.  A typical call is shown below, registering the viewport
grid store state as a modal state.

```javascript
  stateSyncService.register('viewportGridStore', { clearOnModeExit: true });
```

### getState
The `getState` call returns an object containing all of the registered states,
by id.  The values can be read directly, but should not be modified.

### reduce
The `reduce` call is used to apply a set of updates to various states.  The
updates are performed for every state as a simply "set" call.

### onModeExit
When the Mode is exited, the onModeExit is called on the sync state, and this
clears all states registered with `clearOnModeExit: true`.
To avoid clearing the state, the mode definition should store any transient
state in the mode onModeExit and recover it in the `mode.onModeEnter`.

## OHIF Registered State Sync Stores
There are a number of defined stores here.  It is recommended to update this
list as state stores are added:

### Default Extension Stores

* `viewportGridStore` has viewport grid restore information for returning to an earlier grid layout.
* `reuseIdMap` has a map of names to display sets for preserving user changes to hp display set selections.
* `hanging` has a map of the hanging protocol stage information applied (HPInfo)

### Cornerstone Extension Stores

* `lutPresentationStore` has the cornerstone LUT (window level) presentation state information
* `positionPresentationStore` has the cornerstone viewport position (camera, initial image) information
