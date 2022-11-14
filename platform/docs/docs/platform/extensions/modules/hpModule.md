---
sidebar_position: 8
sidebar_label: Hanging Protocol
---
# Module: Hanging Protocol

## Overview
`hangingProtocolModule` provides the protocols for hanging the displaySets in the viewer.
This module can be as simple as loading a list of pre-defined protocols, or it can be more complex
and `fetch` the protocols from a server.

You can read more about hanging protocols in HangingProtocolService.

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
  toolGroupIds: ['default'],
  stages: [
    {
      id: 'hYbmMy3b7pz7GLiaT',
      name: 'default',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 1,
          columns: 2,
        },
      },
      displaySets: [
        {
          id: 'displaySet',
          imageMatchingRules: [],
          seriesMatchingRules: [],
          studyMatchingRules: [],
        },
      ],
      viewports: [
        {
          viewportOptions: {
            toolGroupId: 'default',
          },
          displaySets: [
            {
              options: [],
              id: 'displaySet',
            },
          ],
        },
      ],
      createdDate: '2021-02-23T18:32:42.850Z',
    },
  ],
  numberOfPriorsReferenced: -1,
};

function getHangingProtocolModule() {
  return [
    {
      id: 'default',
      protocol: deafultProtocol,
    },
  ];
}
```



## Skeleton of A Hanging Protocol

The skeleton of a hanging protocol is as follows:


```js
const testProtocol = {
  id: 'test',
  locked: true,
  hasUpdatedPriorsInformation: false,
  name: 'Default',
  createdDate: '2021-02-23T19:22:08.894Z',
  modifiedDate: '2021-02-23T19:22:08.894Z',
  availableTo: {},
  editableBy: {},
  toolGroupIds: ['default'],
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
    {
      id: 'wauZK2QNEfDPwcAQo',
      weight: 1,
      attribute: 'StudyDescription',
      constraint: {
        contains: {
          value: 'PET/CT',
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
        type: 'grid',
        properties: {
          rows: 1,
          columns: 1,
          viewportOptions: [],
        },
      },
      displaySets: [
        {
          id: 'ctDisplaySet',
          imageMatchingRules: [],
          seriesMatchingRules: [
            {
              id: 'GPEYqFLv2dwzCM322',
              weight: 1,
              attribute: 'Modality',
              constraint: {
                equals: {
                  value: 'CT',
                },
              },
              required: true,
            },
          ],
          studyMatchingRules: [],
        },
        {
          id: 'ptACDisplaySet',
          imageMatchingRules: [],
          seriesMatchingRules: [
            {
              id: 'GPEYqFLv2dwzCM322',
              weight: 1,
              attribute: 'Modality',
              constraint: {
                equals: {
                  value: 'PT',
                },
              },
              required: true,
            },
          ],
          studyMatchingRules: [],
        },
        {
          id: 'ptNACDisplaySet',
          imageMatchingRules: [],
          seriesMatchingRules: [
            {
              id: 'GPEYqFLv2dwzCM322',
              weight: 1,
              attribute: 'SeriesDescription',
              constraint: {
                contains: {
                  value: 'Uncorrected',
                },
              },
              required: false,
            },
          ],
          studyMatchingRules: [],
        },
      ],
      viewports: [
        {
          viewportOptions: {
            viewportId: 'ctAxial',
            viewportType: 'stack',
            background: [0, 0, 0],
            orientation: 'AXIAL',
            toolGroupId: 'default',
          },
          displaySets: [
            {
              id: 'ctDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'ptAxial',
            viewportType: 'stack',
            background: [1, 1, 1],
            orientation: 'AXIAL',
            toolGroupId: 'default',
          },
          displaySets: [
            {
              options: {
                voi: {
                  windowWidth: 5,
                  windowCenter: 2.5,
                },
                voiInverted: true,
              },
              id: 'ptACDisplaySet',
            },
          ],
        },
      ],
      createdDate: '2021-02-23T18:32:42.850Z',
    },
  ],
  numberOfPriorsReferenced: -1,
};
```

Let's discuss each property in depth.

### Id
unique identifier for the protocol

### protocolMatchingRules
A list of criteria for the protocol along with the provided points for ranking.

  - `weight`: weight for the matching rule. Eventually, all the registered
    protocols get sorted based on the weights, and the winning protocol gets
    applied to the viewer.
  - `attribute`: tag that needs to be matched against. This can be either
    Study-level metadata or a custom attribute.
    [Learn more about custom attribute matching](#custom-attribute)

  - `constraint`: the constraint that needs to be satisfied for the attribute. It accepts a `validator` which can be
    [`equals`, `doesNotEqual`, `contains`, `doesNotContain`, `startsWith`, `endsWidth`]

    A sample of the matching rule is above which matches against the study description to be PETCT

    ```js
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
    ```

### stages
Each protocol can define one or more stages. Each stage defines a certain layout and viewport rules.
  Therefore, the `stages` property is array of objects, each object being one stage.

### viewportStructure
Defines the layout of the viewer. You can define the number of `rows` and `columns`. There should be `rows * columns` number of
viewport configuration in the `viewports` property. Note that order of viewports are rows first then columns.

```js
viewportStructure: {
    type: 'grid',
    properties: {
      rows: 1,
      columns: 2,
      viewportOptions: [],
    },
},
```

In addition to the equal viewport sizes, you can define viewports to span multiple rows or columns.

```js
viewportStructure: {
    type: 'grid',
    properties: {
      rows: 1,
      columns: 2,
      viewportOptions: [
        {
          x: 0,
          y: 0,
          width: 1 / 4,
          height: 1,
        },
        {
          x: 1 / 4,
          y: 0,
          width: 3 / 4,
          height: 1,
        },
      ],
    },
},
```

### displaySets
Defines the display sets that are available for the stage. Each
include an `id` and some `seriesMatchingRules`

```js
displaySets: [
  {
    id: 'ctDisplaySet',
    imageMatchingRules: [],
    seriesMatchingRules: [
      {
        id: 'GPEYqFLv2dwzCM322',
        weight: 1,
        attribute: 'Modality',
        constraint: {
          equals: {
            value: 'CT',
          },
        },
        required: true,
      },
    ],
    studyMatchingRules: [],
  },
  {
    id: 'ptACDisplaySet',
    imageMatchingRules: [],
    seriesMatchingRules: [
      {
        id: 'GPEYqFLv2dwzCM322',
        weight: 1,
        attribute: 'Modality',
        constraint: {
          equals: {
            value: 'PT',
          },
        },
        required: true,
      },
    ],
    studyMatchingRules: [],
  },
  {
    id: 'ptNACDisplaySet',
    imageMatchingRules: [],
    seriesMatchingRules: [
      {
        id: 'GPEYqFLv2dwzCM322',
        weight: 1,
        attribute: 'Modality',
        constraint: {
          equals: {
            value: 'PT',
          },
        },
        required: true,
      },
      {
        id: 'GPEYqFLv2dwzCM322',
        weight: 1,
        attribute: 'SeriesDescription',
        constraint: {
          contains: {
            value: 'Uncorrected',
          },
        },
        required: false,
      },
    ],
    studyMatchingRules: [],
  },
],
```

As you see in the above `displaySets` entry in the example above, there are
three defined displaySets that __will__ become available later on in the `viewports`
section of the protocol.


1. `ctDisplaySet` which is matched against the CT modality
2. `ptACDisplaySet` which is matched against the PT modality
3. `ptNACDisplaySet` which is matched against the PT modality and also contains the `Uncorrected` series description

### viewports
This field includes the viewports that will get hung on the viewer.

```js
viewports: [
  {
    viewportOptions: {
      viewportId: 'ctAxial',
      viewportType: 'stack',
      background: [0, 0, 0],
      orientation: 'AXIAL',
      toolGroupId: 'default',
    },
    displaySets: [
      {
        id: 'ctDisplaySet',
      },
    ],
  },
  {
    viewportOptions: {
      viewportId: 'ptAxial',
      viewportType: 'stack',
      background: [1, 1, 1],
      orientation: 'AXIAL',
      toolGroupId: 'default',
    },
    displaySets: [
      {
        options: {
          voi: {
            windowWidth: 5,
            windowCenter: 2.5,
          },
          voiInverted: true,
        },
        id: 'ptACDisplaySet',
      },
    ],
  },
],
```

As you can see there are two viewports defined. The first one is a CT viewport and the second one is a PT viewport.

Each viewport has two properties:

1. `viewportOptions`: defines the viewport properties such as
   - `viewportId`: unique identifier for the viewport (optional)
   - `viewportType`: type of the viewport (required - currently only stack)
   - `background`: background color of the viewport (optional)
   - `orientation`: orientation of the viewport (optional)
   - `toolGroupId`: tool group that will be used for the viewport (optional)


2. `displaySets`: defines the display sets that are available for the viewport. It is an array of objects, each object being one display set.
   - `id`: id of the display set (required)
   - `options` (optional): options for the display set
        - voi: windowing options for the display set
        - voiInverted: whether the VOI is inverted or not (optional)
