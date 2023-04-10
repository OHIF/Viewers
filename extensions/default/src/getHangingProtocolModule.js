const defaultProtocol = {
  id: 'default',
  locked: true,
  // Don't store this hanging protocol as it applies to the currently active
  // display set by default
  // cacheId: null,
  hasUpdatedPriorsInformation: false,
  name: 'Default',
  createdDate: '2021-02-23T19:22:08.894Z',
  modifiedDate: '2023-04-01',
  availableTo: {},
  editableBy: {},
  protocolMatchingRules: [],
  toolGroupIds: ['default'],
  // -1 would be used to indicate active only, whereas other values are
  // the number of required priors referenced - so 0 means active with
  // 0 or more priors.
  numberOfPriorsReferenced: 0,
  // Default viewport is used to define the viewport when
  // additional viewports are added using the layout tool
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
  displaySetSelectors: {
    defaultDisplaySetId: {
      // Matches displaysets, NOT series
      seriesMatchingRules: [
        // Try to match series with images by default, to prevent weird display
        // on SEG/SR containing studies
        {
          attribute: 'numImageFrames',
          constraint: {
            greaterThan: { value: 0 },
          },
        },
        // This display set will select the specified items by preference
        // It has no affect if nothing is specified in the URL.
        {
          attribute: 'isDisplaySetFromUrl',
          weight: 10,
          constraint: {
            equals: true,
          },
        },
      ],
      // Can be used to select matching studies
      // studyMatchingRules: [],
    },
  },
  stages: [
    {
      name: 'default',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 1,
          columns: 1,
        },
      },
      viewports: [
        {
          viewportOptions: {
            viewportType: 'stack',
            toolGroupId: 'default',
            // This will specify the initial image options index if it matches in the URL
            // and will otherwise not specify anything.
            initialImageOptions: {
              custom: 'sopInstanceLocation',
            },
            // Other options for initialImageOptions, which can be included in the default
            // custom attribute, or can be provided directly.
            //   index: 180,
            //   preset: 'middle', // 'first', 'last', 'middle'
            // },
          },
          displaySets: [
            {
              id: 'defaultDisplaySetId',
            },
          ],
        },
      ],
      createdDate: '2021-02-23T18:32:42.850Z',
    },

    // This is an example of a 2x2 layout that requires at least 2 viewports
    // filled to be navigatable to
    {
      name: '2x2',
      // Indicate that the number of viewports needed is 2 filled viewports,
      // but that 4 viewports are preferred.
      stageActivation: {
        enabled: {
          minViewportsMatched: 4,
        },
        passive: {
          minViewportsMatched: 2,
        },
      },

      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 2,
          columns: 2,
        },
      },
      viewports: [
        {
          viewportOptions: {
            toolGroupId: 'default',
          },
          displaySets: [
            {
              id: 'defaultDisplaySetId',
              matchedDisplaySetsIndex: 3,
            },
          ],
        },
        {
          viewportOptions: {
            toolGroupId: 'default',
          },
          displaySets: [
            {
              id: 'defaultDisplaySetId',
              matchedDisplaySetsIndex: 2,
            },
          ],
        },
        {
          viewportOptions: {
            toolGroupId: 'default',
          },
          displaySets: [
            {
              id: 'defaultDisplaySetId',
              matchedDisplaySetsIndex: 1,
            },
          ],
        },
        {
          viewportOptions: {},
          displaySets: [
            {
              id: 'defaultDisplaySetId',
              matchedDisplaySetsIndex: 0,
            },
          ],
        },
      ],
    },

    {
      name: '3x1',
      // Indicate that the number of viewports needed is 2 filled viewports,
      // but that 4 viewports are preferred.
      stageActivation: {
        enabled: {
          minViewportsMatched: 3,
        },
      },

      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 1,
          columns: 3,
        },
      },
      viewports: [
        {
          viewportOptions: {
            toolGroupId: 'default',
          },
          displaySets: [
            {
              id: 'defaultDisplaySetId',
              matchedDisplaySetsIndex: 2,
            },
          ],
        },
        {
          viewportOptions: {
            toolGroupId: 'default',
          },
          displaySets: [
            {
              id: 'defaultDisplaySetId',
              matchedDisplaySetsIndex: 1,
            },
          ],
        },
        {
          viewportOptions: {},
          displaySets: [
            {
              id: 'defaultDisplaySetId',
            },
          ],
        },
      ],
    },

    // This is an example of a layout with more than one element in it
    // It can be navigated to using , and . (prev/next stage)
    {
      name: '2x1',
      // Indicate that the number of viewports needed is 1 filled viewport,
      // but that 2 viewports are preferred.
      stageActivation: {
        enabled: {
          minViewportsMatched: 3,
        },
      },

      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 1,
          columns: 2,
        },
      },
      viewports: [
        {
          viewportOptions: {
            toolGroupId: 'default',
            // initialImageOptions: {
            //   index: 180,
            //   preset: 'middle', // 'first', 'last', 'middle'
            // },
          },
          displaySets: [
            {
              id: 'defaultDisplaySetId',
              // Shows the second index of this image set
              matchedDisplaySetsIndex: 1,
            },
          ],
        },
        {
          viewportOptions: {},
          displaySets: [
            {
              id: 'defaultDisplaySetId',
            },
          ],
        },
      ],
    },

    {
      name: '2x1',
      // Indicate that the number of viewports needed is 1 filled viewport,
      // but that 2 viewports are preferred.
      stageActivation: {
        enabled: {
          minViewportsMatched: 3,
        },
      },

      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 2,
          columns: 1,
        },
      },
      viewports: [
        {
          viewportOptions: {},
          displaySets: [
            {
              id: 'defaultDisplaySetId',
              // Shows the second index of this image set
              matchedDisplaySetsIndex: 1,
            },
          ],
        },
        {
          viewportOptions: {},
          displaySets: [
            {
              id: 'defaultDisplaySetId',
            },
          ],
        },
      ],
    },
  ],
};

function getHangingProtocolModule() {
  return [
    {
      name: defaultProtocol.id,
      protocol: defaultProtocol,
    },
  ];
}

export default getHangingProtocolModule;
