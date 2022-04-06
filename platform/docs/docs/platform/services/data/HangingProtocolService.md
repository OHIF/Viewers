---
sidebar_position: 4
sidebar_label: Hanging Protocol Service
---
# Hanging Protocol Service

## Overview
`HangingProtocolService` is a migration of the `OHIF-v1` hanging protocol engine.
This service handles the arrangement of the images in the viewport.
In short, the registered protocols will get matched with the Series that are available
for the series. Each protocol gets a point, and they are ranked. The winning protocol gets
applied and its settings run for the viewports.

You can read more about hanging protocols [here](http://dicom.nema.org/dicom/Conf-2005/Day-2_Selected_Papers/B305_Morgan_HangProto_v1.pdf). In short
with `OHIF-v3` hanging protocols you can:

- Define what layout of the viewport should the viewer starts with (2x2 layout)
- Define which series gets displayed in which position of the layout
- Apply certain initial viewport settings; e.g., inverting the contrast
- Enable certain tools based on what series are displayed: link prostate T2 and ADC MRI.




## Skeleton of A Hanging Protocol
You can find the skeleton of the hanging protocols here:

```js
const deafultProtocol = {
  id: 'defaultProtocol',
  locked: true,
  hasUpdatedPriorsInformation: false,
  name: 'Default',
  createdDate: '2021-02-23T19:22:08.894Z',
  modifiedDate: '2021-02-23T19:22:08.894Z',
  availableTo: {},
  editableBy: {},
  protocolMatchingRules: [],
  stages: [
    {
      id: 'nwzau7jDkEkL8djfr',
      name: 'oneByOne',
      viewportStructure: {
        type: 'grid',
        properties: {
          rows: 1,
          columns: 1,
        },
      },
      viewports: [
        {
          viewportSettings: [],
          imageMatchingRules: [],
          seriesMatchingRules: [],
          studyMatchingRules: [],
        },
      ],
      createdDate: '2021-02-23T19:22:08.894Z',
    },
  ],
  numberOfPriorsReferenced: -1,
};
```

Let's discuss each property in depth.




- `id`: unique identifier for the protocol

- `protocolMatchingRules`:  A list of criteria for the protocol along with the provided points for ranking.

  - `weight`: weight for the matching rule. Eventually, all the registered protocols get sorted based on the weights, and the winning
    protocol gets applied to the viewer.
  - `attriubte`: tag that needs to be matched against. This can be either Study-level metadata or a custom attribute. [Learn more about custom attribute matching](#custom-attribute)

  - `constraint`: the constraint that needs to be satisfied for the attribute. It accepts a `validator` which can be
    [`equals`, `doesNotEqual`, `contains`, `doesNotContain`, `startsWith`, `endsWidth`]

    A sample of the matching rule is:

    ```js
    {
      id: 'wauZK2QNEfDPwcAQo',
      weight: 1,
      attribute: 'StudyInstanceUID',
      constraint: {
        equals: {
          value: '1.3.6.1.4.1.25403.345050719074.3824.20170125112931.11',
        },
      },
      required: true,
    }
    ```

- `stages`: Each protocol can define one or more stages. Each stage defines a certain layout and viewport rules.
  Therefore, the `stages` property is array of objects, each object being one stage.

  - `viewportStructure`: Defines the layout of the viewer. You can define the number of `rows` and `columns`.
    There should be `rows * columns` number of viewport configuration in the `viewports` property. Note that order of viewports are rows first then columns.

  - `viewportSettings`: custom settings to be applied to the viewport. This can be a `voi` being applied
    to the viewer or a tool to get enabled. We will discuss viewport-specific settings [below](#viewport-settings)

  - `imageMatchingRules (comming soon)`: setting the image slice for the viewport.

  - `seriesMatchingRules`: the most important rule that matches series in the viewport. For instance, the following stage
    configuration will create a one-by-two layout and put the series whose description contains `t2` on the left, and a series with
    description that contains `adc` on the right. (order of viewports are rows, first then columns)

    ```js
    stages: [
      {
        id: 'hYbmMy3b7pz7GLiaT',
        name: 'oneByThree',
        viewportStructure: {
          type: 'grid',
          properties: {
            rows: 1,
            columns: 2,
          },
        },
        viewports: [
          // viewport 1
          {
            viewportSettings: [],
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'vSjk7NCYjtdS3XZAw',
                weight: 1,
                attribute: 'SeriesDescription',
                constraint: {
                  contains: {
                    value: 't2',
                  },
                },
                required: false,
              },
            ],
            studyMatchingRules: [],
          },
          // viewport 2
          {
            viewportSettings: [],
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'vSjk7NCYjtdS3XZAw',
                weight: 1,
                attribute: 'SeriesDescription',
                constraint: {
                  contains: {
                    value: 'ADC',
                  },
                },
                required: true,
              },
            ],
            studyMatchingRules: [],
          },
        ],
      },
    ]
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
  - `hpAlreadyApplied`: An array which tracks whether HPServices has been applied on each viewport.

- `addProtocols`: adds provided protocols to the list of registered protocols for matching

- `run(studyMetaData, protocol)`: runs the HPService with the provided studyMetaData and optional protocol.
  If protocol is not given, HP Matching engine will search all the registered protocols for the best matching one based on the constraints.

- `addCustomAttribute`: adding a custom attribute for matching. (see below)

- `addCustomViewportSetting`: adding a custom setting to a viewport (initial `voi`). Below, we explain
  in detail how to add custom viewport settings via protocol definitions. `addCustomViewportSetting` is another way to set
  these settings which is exposed by API

-

Default initialization of the modes handles running the `HangingProtocolService`

## Custom Attribute
In some situations, you might want to match based on a custom attribute and not the DICOM tags. For instance,
if you have assigned a `timepointId` to each study, and you want to match based on it.
Good news is that, in `OHIF-v3` you can define you custom attribute and use it for matching.

There are various ways that you can let `HangingProtocolService` know of you custom attribute.
We will show how to add it inside the mode configuration.


```js
const deafultProtocol = {
  id: 'defaultProtocol',
  /** ... **/
  protocolMatchingRules: [
    {
      id: 'vSjk7NCYjtdS3XZAw',
      weight: 3,
      attribute: 'timepoint',
      constraint: {
        equals: {
          value: 'first',
        },
      },
      required: false,
    },
  ],
  stages: [
    /** ... **/
  ],
  numberOfPriorsReferenced: -1,
}

// Custom function for custom attribute
const getTimePointUID = (metaData) => {
  // requesting the timePoint Id
  return myBackEndAPI(metaData)
}

function modeFactory() {
  return {
    id: 'myMode',
    /** .. **/
    routes: [
      {
        path: 'myModeRoute',
        init: async ({}) => {
          const { DicomMetadataStore, HangingProtocolService } =
            servicesManager.services

          const onSeriesAdded = ({
            StudyInstanceUID,
            madeInClient = false,
          }) => {
            const studyMetadata = DicomMetadataStore.getStudy(StudyInstanceUID)

            // Adding custom attribute to the hangingprotocol
            HangingProtocolService.addCustomAttribute(
              'timepoint',
              'timepoint',
              (metaData) => getFirstMeasurementSeriesInstanceUID(metaData)
            )

            HangingProtocolService.run(studyMetadata)
          }

          DicomMetadataStore.subscribe(
            DicomMetadataStore.EVENTS.SERIES_ADDED,
            onSeriesAdded
          )
        },
      },
    ],
    /** ... **/
  }
}
```


## Viewport Settings
You can define custom settings to be applied to each viewport. There
are two types of settings:

- `viewport settings`: Currently we support two viewport settings

  - `voi`: applying an initial `voi` by setting the windowWidth and windowCenter
  - `inverted`: inverting the viewport color (e.g., for PET images)

- `props settings`: Running commands after the first render; e.g., enabling the link tool


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
]
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
]
```
