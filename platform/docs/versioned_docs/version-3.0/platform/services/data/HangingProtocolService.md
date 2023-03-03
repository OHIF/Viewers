---
sidebar_position: 4
sidebar_label: Hanging Protocol Service
---

# Hanging Protocol Service

## Overview

`HangingProtocolService` is a migration of the `OHIF-v1` hanging protocol
engine. This service handles the arrangement of the images in the viewport. In
short, the registered protocols will get matched with the DisplaySets that are
available for the study. Each protocol gets a score, and they are ranked. The
winning protocol gets applied and its settings run for the viewports.

You can read more about hanging protocols
[here](http://dicom.nema.org/dicom/Conf-2005/Day-2_Selected_Papers/B305_Morgan_HangProto_v1.pdf).
In short with `OHIF-v3` hanging protocols you can:

- Define what layout of the viewport should the viewer starts with (eg 2x2 layout)
- Define which series gets displayed in which position of the layout
- Apply certain initial viewport settings; e.g., inverting the contrast
- Enable certain tools based on what series are displayed: link prostate T2 and
  ADC MRI.
- Apply synchronization settings between different viewports or between setting and viewports
- Register custom synchronization settings for viewports
- Register custom attribute extractors
- Select "next display set" from the matching display sets, both on navigation and initial view

## Skeleton of A Hanging Protocol

You can find the skeleton of the hanging protocols here:

```js
const defaultProtocol = {
  id: 'test',
  locked: true,
  hasUpdatedPriorsInformation: false,
  name: 'Default',
  createdDate: '2021-02-23T19:22:08.894Z',
  modifiedDate: '2021-02-23T19:22:08.894Z',
  availableTo: {},
  editableBy: {},
  toolGroupIds: [
    'ctToolGroup',
    'ptToolGroup',
  ],
  imageLoadStrategy: 'interleaveTopToBottom', // "default" , "interleaveTopToBottom",  "interleaveCenter"
  protocolMatchingRules: [
    {
      id: 'wauZK2QNEfDPwcAQo',
      weight: 1,
      attribute: 'StudyDescription',
      constraint: {
        contains: {
          value: 'PETCT',
        },
      },
      required: false,
    },
  ],
  stages: [
    {
      id: 'hYbmMy3b7pz7GLiaT',
      name: 'default',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 1,
          columns: 1,
        },
      },
      displaySets: [
        {
          id: 'displaySet',
          seriesMatchingRules: [
            {
              id: 'GPEYqFLv2dwzCM322',
              weight: 1,
              attribute: 'Modality',
              constraint: {
                equals: 'CT',
              },
              required: true,
            },
            {
              id: 'vSjk7NCYjtdS3XZAw',
              weight: 1,
              attribute: 'numImageFrames',
              constraint: {
                greaterThan: 10,
              },
            },
          ],
          studyMatchingRules: [],
        },
      ],
      viewports: [
        {
          viewportOptions: {
            viewportId: 'ctAXIAL',
            viewportType: 'volume',
            orientation: 'axial',
            toolGroupId: 'ctToolGroup',
            initialImageOptions: {
              // index: 5,
              preset: 'first', // 'first', 'last', 'middle'
            },
            syncGroups: [
              {
                type: 'cameraPosition',
                id: 'axialSync',
                source: true,
                target: true,
              },
            ],
          },
          displaySets: [
            {
              id: 'displaySet',
            },
          ],
        },
      ],
    },
  ],
  numberOfPriorsReferenced: -1,
}
```

Let's discuss each property in depth.

- `id`: unique identifier for the protocol
- `name`: Name displayed to the user to select this protocol

- `protocolMatchingRules`: A list of criteria for the protocol along with the
  provided points for ranking.

  - `weight`: weight for the matching rule. Eventually, all the registered
    protocols get sorted based on the weights, and the winning protocol gets
    applied to the viewer.
  - `attribute`: tag that needs to be matched against. This can be either
    Study-level metadata or a custom attribute.
    [Learn more about custom attribute matching](#custom-attribute)

  - `constraint`: the constraint that needs to be satisfied for the attribute. It accepts a `validator` which can be
    [`equals`, `doesNotEqual`, `contains`, `doesNotContain`, `startsWith`, `endsWidth`]

    A sample of the matching rule is:

    ```js
    {
      weight: 1,
      attribute: 'StudyInstanceUID',
      constraint: {
        equals: '1.3.6.1.4.1.25403.345050719074.3824.20170125112931.11',
      },
      required: true,
    }
    ```


- `stages`: Each protocol can define one or more stages. Each stage defines a certain layout and viewport rules.
  Therefore, the `stages` property is array of objects, each object being one stage.

  - `displaySets`: Defines the matching rules for which display sets to use.
  - `viewportStructure`: Defines the layout of the viewer. You can define the
    number of `rows` and `columns`.
  - `viewports` defines the actual viewports to display.  There should be `rows * columns` number of
    these `viewports` property, ordered rows first, then columns.


    ```js
    stages: [
      {
        id: 'hYbmMy3b7pz7GLiaT',
        name: 'oneByTwo',
        viewportStructure: {
          type: 'grid',
          properties: {
            rows: 1,
            columns: 3,
          },
        },
        viewports: [
          // viewport 1
        {
          viewportOptions: {
            viewportId: 'ctAXIAL',
            viewportType: 'volume',
            orientation: 'axial',
            toolGroupId: 'ctToolGroup',
            initialImageOptions: {
              // index: 5,
              preset: 'first', // 'first', 'last', 'middle'
            },
            syncGroups: [
              {
                type: 'cameraPosition',
                id: 'axialSync',
                source: true,
                target: true,
              },
            ],
          },
          displaySets: [
            {
              id: 'displaySet',
            },
          ],
        },
    ];
    ```

## Events

There are two events that get publish in `HangingProtocolService`:

| Event        | Description                                                          |
| ------------ | -------------------------------------------------------------------- |
| NEW_LAYOUT   | Fires when a new layout is requested by the `HangingProtocolService` |
| STAGE_CHANGE | Fires when the the stage is changed in the hanging protocols         |

## API

- `getState`: returns an array: `[matchDetails, hpAlreadyApplied]`:

  - `matchDetails`: matching details for the series
  - `hpAlreadyApplied`: An array which tracks whether HPServices has been
    applied on each viewport.

- `addProtocols`: adds provided protocols to the list of registered protocols
  for matching

- `run({ studies, displaySets }, protocol)`: runs the HPService with the provided
  list of studies, display sets and optional protocol.
  If protocol is not given, HP Matching
  engine will search all the registered protocols for the best matching one
  based on the constraints.

- `addCustomAttribute`: adding a custom attribute for matching. (see below)

Default initialization of the modes handles running the `HangingProtocolService`

## Custom Attribute
In some situations, you might want to match based on a custom attribute and not the DICOM tags. For instance,
if you have assigned a `timepointId` to each study, and you want to match based on it.
Good news is that, in `OHIF-v3` you can define you custom attribute and use it for matching.

In some situations, you might want to match based on a custom attribute and not
the DICOM tags. For instance, if you have assigned a `timepointId` to each study
and you want to match based on it. Good news is that, in `OHIF-v3` you can
define you custom attribute and use it for matching.

There are various ways that you can let `HangingProtocolService` know of you
custom attribute. We will show how to add it inside the an extension.  This extension
also shows how to register a sync group service which can be referenced
in the sync group settings.

```js
const myCustomProtocol = {
  id: 'myCustomProtocol',
  /** ... **/
  protocolMatchingRules: [
    {
      id: 'vSjk7NCYjtdS3XZAw',
      attribute: 'timepointId',
      constraint: {
        equals: 'first',
      },
      required: false,
    },
  ],
...

// Custom function for custom attribute
const getTimePointUID = metaData => {
  // requesting the timePoint Id
  return myBackEndAPI(metaData);
};

 preRegistration: ({
    servicesManager,
  }) => {
    const { HangingProtocolService, SyncGroupService } = servicesManager.services;
    HangingProtocolService.addCustomAttribute('timepointId', 'TimePoint ID', getTimePointUID);
    SyncGroupService.setSynchronizer('initialzoompan', initialZoomPan);
  }
```

## Viewport Settings

You can define custom settings to be applied to each viewport. There are two
types of settings:

- `viewport settings`: Currently we support two viewport settings

  - `voi`: applying an initial `voi` by setting the windowWidth and windowCenter
  - `inverted`: inverting the viewport color (e.g., for PET images)

- `props settings`: Running commands after the first render; e.g., enabling the
  link tool

Examples of each settings are :

```js
viewportSettings: [
  {
    options: {
      itemId: 'SyncScroll',
      interactionType: 'toggle',
      commandName: 'toggleSynchronizer',
      commandOptions: { toggledState: true },
    },
    commandName: 'setToolActive',
    type: 'props',
  },
];
```

and

```js
viewportSettings: [
  {
    options: {
      voi: {
        windowWidth: 400,
        windowCenter: 40,
      },
    },
    commandName: '',
    type: 'viewport',
  },
];
```

## Sync Groups
The sync groups are listeners to events that synchronize viewport settings to
some other settings.  There are three default/provided sync groups: `zoomPan`,
`cameraPosition` and `voi`.  These are defined in the `syncGroups` array.
Additionally, other synchronization types can be created and registered on the
`SyncGroupService.setSynchronizer`, by registering a new id, and a creator method.

The sync group service is specific to the `cornerstone-extension` because the
actual behaviour of the synchronizers is dependent on the specific viewport.
Different viewport types could redifine the same synchronizer names in
different ways appropriate to that viewport.
