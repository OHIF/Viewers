---
sidebar_position: 4
sidebar_label: Hanging Protocol Service
---

# Hanging Protocol Service

## Overview


This service handles the arrangement of the images in the viewport. In
short, the registered protocols will get matched with the DisplaySets that are
available. Each protocol gets a score, and they are ranked. The
winning protocol (highest score) gets applied and its settings run for the viewports
to be arranged.

You can read more about a HangingProtocol Structure and its properties in the
[HangingProtocol Module](../../extensions/modules/hpModule.md).

The rest of this page is dedicated on how the Hanging Protocol Service works and
what you can do with it.

## Protocols

Protocols are provided by each extension's HangingProtocolModule and are
registered automatically to the HangingProtocolService.

All protocols are stored in the `HangingProtocolService` using their `id` as the key, and the protocol itself as the value.

## Events

There are two events that get publish in `HangingProtocolService`:

| Event        | Description                                                          |
| ------------ | -------------------------------------------------------------------- |
| NEW_LAYOUT   | Fires when a new layout is requested by the `HangingProtocolService` |
| STAGE_CHANGE | Fires when the the stage is changed in the hanging protocols         |
| PROTOCOL_CHANGED | Fires when the the protocol is changed in the hanging protocols         |
| HANGING_PROTOCOL_APPLIED_FOR_VIEWPORT | Fires when the hanging protocol applies for a viewport (sets its displaySets) |



## API

- `getMatchDetails`: returns an object which contains the details of the
  matching for the viewports, displaySets and whether the protocol is
  applied to the viewport or not yet.

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

- `setProtocol`: applies a protocol to the current studies, it can be used for instance to apply a
  hanging protocol when pressing a button in the toolbar. We use this for applying 'mpr'
  hanging protocol when pressing the MPR button in the toolbar. `setProtocol` will
  accept a set of options that can be used to define the displaySets that will be
  used for the protocol. If no options are provided, all displaySets will
  be used to match the protocol.


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
