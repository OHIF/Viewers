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

## Protocol Definition
Protocols are defined in a getHangingProtocolModule inside an extension.  As such,
they are defined with a module structure that starts with an id, and has field protocol
that is the actual protocol definition.  This setup allows defining more than
one protocol within a module, each one needing it's own definition file.

```javascript
import MyProtocol from './MyProtocol';
export default function getHangingProtocolModule() {
  return [
    {
      id: MyProtocol.id,
      protocol: MyProtocol,
    },
  ];
}
```

Within the protocol itself, the structure is laid out as described in the HangingProtocol.ts
type definition, starting with `Protocol`.  See the type definition for more details.

## Events

There are two events that get publish in `HangingProtocolService`:

| Event        | Description                                                          |
| ------------ | -------------------------------------------------------------------- |
| NEW_LAYOUT   | Fires when a new layout is requested by the `HangingProtocolService` |
| PROTOCOL_CHANGED | Fires when the the protocol is changed in the hanging protocols, or when the applied stage is changed. |
| RESTORE_PROTOCOL | Fires when the protocol or stage is restored, for example, after turning off MPR mode |
| STAGE_ACTIVATION | Fires when the stages are known to have stage.status set. |

## Stage Activation and Status
Sometimes a hanging protocol can be applicable generally, but not all stages
should be shown by default, or should be shown at all.  This can be handled by
using the stage activation to control whether the stage is shown by default (`enabled`),
whether it can be navigated to (`passive`) or whether it should not be shown
at all (`disabled`).

The `stage.status` is used to control this, and the status is controlled by
the stage activate.  The status values are:

* enabled - meaning that the stage is fully applicable
* passive - meaning that the stage can be applied, but might be missing details
* disabled - meaning that the study has insufficient information for this stage

The default values for no `stageActivation` are to assume that `enabled` has `minViewports` of 1,
and `passive` has `minViewports=0`.  That is, enable the stage if at least one
viewport is filled, and make it passive if no viewports are filled.

The setting for these are controlled by the stageActivation property, for example
the following:

```javascript
stageActivation: {
  // The enabled activation specifies requirements to enable the stage, that is,
  // make it preferred.
  enabled: {
    // The default value here is 1, and indicates how many non-blank viewports
    // are required.
    minViewportsMatched: 3,
    // This enables specifying cross cutting concerns, such as having a stage
    // only apply to males or females, and is a list of display set selector ids
    displaySetSelectorsMatched: ['dsMale'],
  },
  // The passive check is performed first.  If it fails, the enabled is NOT
  // checked, but the status set to disabled.  The default passive check
  // should always be passed, so it is fine to just define enabled if desired.
  passive: {
    // The default is 0, which means allow the stage even if no viewports are
    // filled.  This allows dragging and dropping into the viewports to
    // make matches manually, which can then be re-used for other stages.
    minViewportsMatched: 0,
    displaySetSelectorsMatched: [...],
  },
}
```

## API

- `destroy`: Destroys the HP service

- `reset` and `onModeEnter`: Resets the HP service to not have any active
  hanging protocols

- `getActiveProtocol`: Returns an object of the internal state of the HP service,
  useful for storing said state, as well as for getting direct access to the
  protocol and stage objects.  Users of this should count on it being not completely
  stable as to exactly what this returns, as internal details can change.

- `getState`: Returns the currently applied protocol ID, stage index and active study UID.
   This information is storable/usable as state information to be used elsewhere.

- `getDefaultProtocol`: Returns the default protocol to apply.

- `getMatchDetails`: returns an object which contains the details of the
  matching for the viewports, displaySets and whether the protocol is
  applied to the viewport or not yet.  This is deprecated as it is expected
  to be communicated by events instead.

- `getProtocols`: Returns a list of the currently active protocols.

- `getProtocolById`: Gets the protocol with the given id.

- `addProtocol`: adds provided protocol to the list of registered protocols
  for matching.  Will replacing any protocol with the same id, allowing, for example,
  to replace the default protocol.

- `setActiveProtocols`: Choose the protocols which are active.  Can take a
single protocol id or a list.  When a single one is provided, that one will be
applied whether or not the required rules match.  Called automatically on mode
init.

- `setActiveStudyUID`: Sets the given study UID as active, which has significance
   in terms of the matching rules being able to match against the active study.

- `run({studies, activeStudy, displaySets }, protocolId)`: runs the HPService with the provided
  studyMetaData and optional protocolId. If protocol is not given, HP Matching
  engine will search all the registered protocols for the best matching one
  based on the constraints.

- `registerImageLoadStrategy`: Adds a custom image load strategy.

- `addCustomAttribute`: adding a custom attribute for matching. (see below)

- `setProtocol`: applies a protocol to the current studies, it can be used for instance to apply a
  hanging protocol when pressing a button in the toolbar. We use this for applying 'mpr'
  hanging protocol when pressing the MPR button in the toolbar. `setProtocol` will
  accept a set of options that can be used to define the displaySets that will be
  used for the protocol. If no options are provided, all displaySets will
  be used to match the protocol.

- `getStageIndex`: Finds the stage index for a given set of match keys.  Currently
   only works on the currently active protocol, but is supposed to be able to work
   with other protocols as well.

- `getMissingViewport`: Returns a viewport object to be used as the missing
  viewport instance.  This is used to fill out new viewports.

Default initialization of the modes handles running the `HangingProtocolService`

## Hanging Protocol Instance Definition
A hanging protocol has an id provided in the module which is used to identify
the protocol.  Mostly these should include the module name so that they
do not overlap, with the suggested id being `${moduleId}.${simpleName}`.  The
'default' name is used as the hanging protocol id when no other protocol applies,
and can be set as the last module listed containing 'default'.

A hanging protocol can also be defined with a generator.
A generator is a function we can write this way:

```ts
function protocolGenerator({ servicesManager, commandsManager }) {
  // Some computations using services and commands ...

  return {
    protocol: generatedProtocol
  }
}
```

See the typescript definitions for more details on the structure of protocols.

## Additional viewports for layout - `defaultViewport`
Sometimes the user manually selects a layout of a given size, say `2x3`.  The
hanging protocol can define what viewport options to use for this viewport by
defining an extra viewport option in `defaultViewport`.  For example:

```javascript
  defaultViewport: {
    viewportOptions: {
      viewportType: 'stack',
      toolGroupId: 'default',
      allowUnmatchedView: true,
    },
    displaySets: [
      {
        id: 'defaultDisplaySetId',
        matchedDisplaySetsIndex: -1,
      },
    ],
  },
```

This allows defining the type of additional viewports, what tool group etc they
are allowed in, and which display set is used to fill them.  In the above case,
the display set is the same as the other viewports, but the
`matchedDisplaySetsIndex=-1`, so that means find the next matching display set
from the display set selector which isn't already filling a view.

## Custom Attribute
In some situations, you might want to match based on a custom
attribute and not the DICOM tags. For instance,
if you have assigned a `timepointId` to each study, and you want to match based on it.
Good news is that, in `OHIF-v3` you can define you custom attribute and use it for matching.

There are various ways that you can let `HangingProtocolService` know of you
custom attribute. We will show how to add it inside the mode configuration.

```js
const defaultProtocol = {
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

### Custom Attributes for Viewport Options

The custom attributes can also be used for viewport options.  This example,
from the default hanging protocol navigates the image to the image
specified in the URL:

```javascript
viewportOptions: {
  initialImageOptions: {
    // custom attribute name is selected by 'custom'
    custom: 'sopInstanceLocation',
    // This is the value returned if the above doesn't return anything
    defaultValue: { index: 5 },
  }
}
```

### Included Custom Attributes

A few custom attributes are included under @ohif/extension-test, these are namely:
*sameAs
*maxNumImageFrames
*numberOfDisplaySets

To use these included custom attributes, the extension will need to be enabled under platform/app/pluginConfig.json:

```javascript
{
  "extensions": [
    ...
    {
      "packageName": "@ohif/extension-test",
      "version": "3.4.0"
    },
    ...
  ]
}
 ```

Furthermore, the extension will also need to be included under extensionDependencies in the desired mode (e.g. modes/tmtv/src/index.js):

```javascript
const extensionDependencies = {
   '@ohif/extension-default': '^3.0.0',
   '@ohif/extension-cornerstone': '^3.0.0',
   '@ohif/extension-tmtv': '^3.0.0',
   '@ohif/extension-test': '^0.0.1',
 };
 ```

The below example modifies the included hanging protocol (extensions/tmtv/src/getHangingProtocolModule.js) and uses the sameAs attribute included in the @ohif/extension-test extension to check that the selected PT has the same frame of reference as the CT:

```javascript
ptDisplaySet: {
       ...
       seriesMatchingRules: [
        {
          attribute: 'sameAs',
          sameAttribute: 'FrameOfReferenceUID',
          sameDisplaySetId: 'ctDisplaySet',
          constraint: {
            equals: {
              value: true,
            },
          },
          required: true,
        },
        ...
```
