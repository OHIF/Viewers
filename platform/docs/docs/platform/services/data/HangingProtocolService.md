---
sidebar_position: 4
sidebar_label: Hanging Protocol Service
---

# Hanging Protocol Service

## Overview

`HangingProtocolService` is a migration of the `OHIF-v1` hanging protocol
engine along with various improvements and fixes.
This service handles the arrangement of the images in the viewport. In
short, the registered protocols will get matched with the DisplaySets that are
available. Each protocol gets a score, and they are ranked. The
winning protocol gets applied and its settings run for the viewports.

You can read more about hanging protocols
[here](http://dicom.nema.org/dicom/Conf-2005/Day-2_Selected_Papers/B305_Morgan_HangProto_v1.pdf).
In `OHIF-v3` hanging protocols you can:

- Define what layout of the viewport should the viewer starts with (2x2 layout)
- Specify the type of the viewport and its orientation
- Define which displaySets gets displayed in which viewport of the layout
- Apply certain initial viewport settings; e.g., inverting the contrast, jumping to a specific slice, etc.
- Add specific synchronization rules for the viewports

## Protocols

A protocol can be an object or a function that returns an object (protocol generator).
Each protocol can get added to the `HangingProtocolService` by using the `addProtocol` method given
an `id` and the protocol itself. As an example, the `default` protocol is an object, while
the 'mpr' protocol is a function that returns the protocol (the reason for this is that the
`mpr` protocol needs to be generated based on the active viewport).

All protocols are stored in the `HangingProtocolService` using their `id` as the key, and
the protocol itself as the value.

## Events

There are two events that get publish in `HangingProtocolService`:

| Event        | Description                                                          |
| ------------ | -------------------------------------------------------------------- |
| NEW_LAYOUT   | Fires when a new layout is requested by the `HangingProtocolService` |
| STAGE_CHANGE | Fires when the the stage is changed in the hanging protocols         |
| PROTOCOL_CHANGED | Fires when the the protocol is changed in the hanging protocols         |



## API

- `getMatchDetails`: returns an object which contains the details of the
  matching for the viewports, displaysets and whether the protocol is
  applied to the viewport or not

- `addProtocol`: adds provided protocol to the list of registered protocols
  for matching

- `setActiveProtocols`: Choose the protocols which are active.  Can take a
single protocol id or a list.  When a single one is provided, that one will be
applied whether or not the required rules match.  Called automatically on mode
init.

- `run({studies, activeStudy, displaySets }, protocolId)`: runs the HPService with the provided
  studyMetaData and optional protocolId. If protocol is not given, HP Matching
  engine will search all the registered protocols for the best matching one
  based on the constraints.

- `addCustomAttribute`: adding a custom attribute for matching. (see below)

Default initialization of the modes handles running the `HangingProtocolService`

## Hanging Protocol Instance Definition
A hanging protocol has an id provided in the module which is used to identify
the protocol.  Mostly these should include the module name so that they
do not overlap, with the suggested id being `${moduleId}.${simpleName}`.  The
'default' name is used as the hanging protocol id when no other protocol applies,
and can be set as the last module listed containing 'default'.

See the typescript definitions for more details on the structure.

## Custom Attribute
In some situations, you might want to match based on a custom attribute and not the DICOM tags. For instance,
if you have assigned a `timepointId` to each study, and you want to match based on it.
Good news is that, in `OHIF-v3` you can define you custom attribute and use it for matching.

There are various ways that you can let `HangingProtocolService` know of you
custom attribute. We will show how to add it inside the mode configuration.

```js
const deafultProtocol = {
  id: 'defaultProtocol',
  /** ... **/
  protocolMatchingRules: [
    {
      weight: 3,
      attribute: 'timepoint',
      constraint: {
        equals: 'first',
      },
      required: false,
    },
  ],
  displaySetSelectors: {
    /** ... */
  }
  stages: [
    /** ... **/
  ],
  numberOfPriorsReferenced: -1,
};

// Custom function for custom attribute
const getTimePointUID = metaData => {
  // requesting the timePoint Id
  return myBackEndAPI(metaData);
};

function modeFactory() {
  return {
    id: 'myMode',
    /** .. **/
    routes: [
      {
        path: 'myModeRoute',
        init: async ({}) => {
          const {
            DicomMetadataStore,
            HangingProtocolService,
          } = servicesManager.services;

          const onSeriesAdded = ({
            StudyInstanceUID,
            madeInClient = false,
          }) => {
            const studyMetadata = DicomMetadataStore.getStudy(StudyInstanceUID);

            // Adding custom attribute to the hangingprotocol
            HangingProtocolService.addCustomAttribute(
              'timepoint',
              'timepoint',
              metaData => getFirstMeasurementSeriesInstanceUID(metaData)
            );

            HangingProtocolService.run(studyMetadata);
          };

          DicomMetadataStore.subscribe(
            DicomMetadataStore.EVENTS.SERIES_ADDED,
            onSeriesAdded
          );
        },
      },
    ],
    /** ... **/
  };
}
```
