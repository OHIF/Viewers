---
sidebar_position: 3
sidebar_label: DisplaySet Service
title: DisplaySet Service
summary: Documentation for OHIF's DisplaySetService, which converts instance metadata into displayable sets for visualization, allowing dynamic creation, updating, and management of display sets from various data sources.
---
# DisplaySet Service

## Overview
`DisplaySetService` handles converting the `instanceMetadata` into `DisplaySet` that `OHIF` uses for the visualization. `DisplaySetService` gets initialized at service startup time, but is then cleared in the `Mode.jsx`. During the initialization `SOPClassHandlerIds` of the `modes` gets registered with the `DisplaySetService`.

:::tip

DisplaySet is a general set of entities and contains links to bunch of displayable objects (images, etc.) Some series might get split up into different displaySets e.g., MG might have mixed views in a single series, but users might want to have separate LCC, RCC, etc. for hanging protocol usage. A viewport renders a display set into a displayable object.

An imageSet is a particular implementation of image displays.
- Learn more about Study (https://www.dicomstandard.org/standards/view/information-object-definitions#sect_A.1.2.2)
- Learn more about Series (https://www.dicomstandard.org/standards/view/information-object-definitions#sect_A.1.2.3)
:::


> Based on the instanceMetadata's `SOPClassHandlerId`, the correct module from the registered extensions is found by `OHIF` and its `getDisplaySetsFromSeries` runs to create a DisplaySet for the Series.  Note
that this is an ordered operation, and consumes the instances as it proceeds, with the first registered
handlers being able to consume instances first.

DisplaySets are created synchronously when the instances metadata is retrieved and added to the [DicomMetaDataStore](../data//DicomMetadataStore.md).  They are ALSO updated when
the DicommetaDataStore receives new data.  This update first checks the addInstances
of existing `DisplaySet` values to see if the new instance belongs in an existing set.
Then, the same process is used as was originally done to create new display sets.

NOTE: Any instances not matched are NOT added to any display set and will not be displayed.

:::::info[Clarification of Terminology]

Display Sets, which are custom to OHIF, are often confused with different DICOM terms, including study, series, and instances. The following are definitions for these terms to alleviate confusion.
<br></br>

DICOM Terms:
* **Study**: A collection of series
* **Series**: A collection of images or objects
* **Instance**: Single image or object
* **Display Set**: Set of displayable objects (Can be anything shown to the user)
:::::

## Adding `madeInClient` display sets
It is possible to filter or combine display sets from different series by
performing the filter operation desired, and then calling the `addActiveDisplaySets`
on the new `DisplaySet` instances.  This allows operations like combining
two series or sub-selecting a series.

## Events
There are three events that get broadcasted in `DisplaySetService`:

| Event                | Description                                          |
| -------------------- | ---------------------------------------------------- |
| DISPLAY_SETS_ADDED   | Fires a displayset is added to the displaysets cache |
| DISPLAY_SETS_CHANGED | Fires when a displayset is changed                   |
| DISPLAY_SETS_REMOVED | Fires when a displayset is removed                   |
| DISPLAY_SET_SERIES_METADATA_INVALIDATED | Fires when a displayset's series metadata has been altered. An object payload for the event is sent with properties: `displaySetInstanceUID` - the UID of the display set affected; `invalidateData` - boolean indicating if data should be invalidated


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

- `addActiveDisplaySets`: Adds a new display set independently of the make operation.

- `setDisplaySetMetadataInvalidated`: Fires the `DISPLAY_SET_SERIES_METADATA_INVALIDATED` event.
