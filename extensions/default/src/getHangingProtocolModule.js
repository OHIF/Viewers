import hpMNGrid from './hangingprotocols/hpMNGrid';
import hpMNCompare from './hangingprotocols/hpCompare';
import hpMammography from './hangingprotocols/hpMammo';
import hpScale from './hangingprotocols/hpScale';

const defaultProtocol = {
  id: 'default',
  locked: true,
  // Don't store this hanging protocol as it applies to the currently active
  // display set by default
  // cacheId: null,
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
          weight: 10,
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
            viewportId: 'default',
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
  ],
};

function getHangingProtocolModule() {
  return [
    {
      name: defaultProtocol.id,
      protocol: defaultProtocol,
    },
    // Create a MxN comparison hanging protocol available by default
    {
      name: hpMNCompare.id,
      protocol: hpMNCompare,
    },
    {
      name: hpMammography.id,
      protocol: hpMammography,
    },
    {
      name: hpScale.id,
      protocol: hpScale,
    },
    // Create a MxN hanging protocol available by default
    {
      name: hpMNGrid.id,
      protocol: hpMNGrid,
    },
  ];
}

export default getHangingProtocolModule;
