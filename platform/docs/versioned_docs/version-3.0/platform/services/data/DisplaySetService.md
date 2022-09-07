---
sidebar_position: 3
sidebar_label: DisplaySet Service
---
# DisplaySet Service


## Overview
`DisplaySetService` handles converting the `instanceMetadata` into `DisplaySet` that `OHIF` uses for the visualization. `DisplaySetService` gets initialized in the `Mode.jsx`. During the initialization `SOPClassHandlerIds` of the `modes` gets registered with the `DisplaySetService`.

> Based on the instanceMetadata's `SOPClassHandlerId`, the correct module from the registered extensions is found by `OHIF` and its `getDisplaySetsFromSeries` runs to create a DisplaySet for the Series.


```js title="platform/core/src/services/DisplaySetService/DisplaySetService.js"
init(extensionManager, SOPClassHandlerIds) {
  this.extensionManager = extensionManager;
  this.SOPClassHandlerIds = SOPClassHandlerIds;
  this.activeDisplaySets = [];
}
```

in `Mode.jsx`

```js title="platform/viewer/src/routes/Mode/Mode.jsx"
export default function ModeRoute(/** ... **/) {
  /** ... **/
  const { DisplaySetService } = servicesManager.services
  const { sopClassHandlers } = mode
  /** ... **/
  useEffect(
    () => {
      /** ... **/

      // Add SOPClassHandlers to a new SOPClassManager.
      DisplaySetService.init(extensionManager, sopClassHandlers)

      /** ... **/
    }
    /** ... **/
  )
  /** ... **/
  return <> /** ... **/ </>
}
```




## Events
There are three events that get broadcasted in `DisplaySetService`:



| Event                | Description                                          |
| -------------------- | ---------------------------------------------------- |
| DISPLAY_SETS_ADDED   | Fires a displayset is added to the displaysets cache |
| DISPLAY_SETS_CHANGED | Fires when a displayset is changed                   |
| DISPLAY_SETS_REMOVED | Fires when a displayset is removed                   |



## API
Let's find out about the public API for `DisplaySetService`.

- `EVENTS`: Object including the events mentioned above. You can subscribe to these events
  by calling DisplaySetService.subscribe(EVENTS.DISPLAY_SETS_CHANGED, myFunction). [Read more about pub/sub pattern here](../pubsub.md)

- `makeDisplaySets(input, { batch, madeInClient, settings } = {}`): Creates displaySet for the provided
  array of instances metadata. Each display set gets a random UID assigned.

  - `input`: Array of instances Metadata
  - `batch = false`: If you need to pass array of arrays of instances metadata to have a batch creation
  - `madeInClient = false`: Disables the events firing
  - `settings = {}`: Hanging protocol viewport or rendering settings. For instance, setting the initial `voi`, or activating a tool upon
    displaySet rendering. [Read more about hanging protocols settings here](./HangingProtocolService.md#Settings)


- `getDisplaySetByUID`: Returns the displaySet based on the DisplaySetUID.

- `getDisplaySetForSOPInstanceUID`: Returns the displaySet that includes an image with the provided SOPInstanceUID

- `getActiveDisplaySets`: Returns the active displaySets

- `deleteDisplaySet`: Deletes the displaySets from the displaySets cache

- `holdChangeEvents`: Prevents firing change events (currently only works on add event).

- `fireHoldChangeEvents`: Causes the change event to be fired IF there were any changes.  No longer holds events.
