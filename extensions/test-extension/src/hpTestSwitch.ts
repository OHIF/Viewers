import { Types } from '@ohif/core';

const viewport0a = {
  viewportOptions: {
    viewportId: 'viewportA',
    toolGroupId: 'default',
    allowUnmatchedView: true,
  },
  displaySets: [
    {
      id: 'defaultDisplaySetId',
    },
  ],
};

const viewport1b = {
  viewportOptions: {
    viewportId: 'viewportB',
    toolGroupId: 'default',
    allowUnmatchedView: true,
  },
  displaySets: [
    {
      matchedDisplaySetsIndex: 1,
      id: 'defaultDisplaySetId',
    },
  ],
};

const viewport2c = {
  viewportOptions: {
    viewportId: 'viewportC',
    toolGroupId: 'default',
    allowUnmatchedView: true,
  },
  displaySets: [
    {
      matchedDisplaySetsIndex: 2,
      id: 'defaultDisplaySetId',
    },
  ],
};

const viewport3d = {
  viewportOptions: {
    viewportId: 'viewportD',
    toolGroupId: 'default',
    allowUnmatchedView: true,
  },
  displaySets: [
    {
      matchedDisplaySetsIndex: 3,
      id: 'defaultDisplaySetId',
    },
  ],
};

const viewport4e = {
  viewportOptions: {
    viewportId: 'viewportE',
    toolGroupId: 'default',
    allowUnmatchedView: true,
  },
  displaySets: [
    {
      matchedDisplaySetsIndex: 4,
      id: 'defaultDisplaySetId',
    },
  ],
};

const viewport5f = {
  viewportOptions: {
    viewportId: 'viewportF',
    toolGroupId: 'default',
    allowUnmatchedView: true,
  },
  displaySets: [
    {
      matchedDisplaySetsIndex: 5,
      id: 'defaultDisplaySetId',
    },
  ],
};

const viewport3a = {
  viewportOptions: {
    viewportId: 'viewportA',
    toolGroupId: 'default',
    allowUnmatchedView: true,
  },
  displaySets: [
    {
      matchedDisplaySetsIndex: 3,
      id: 'defaultDisplaySetId',
    },
  ],
};

const viewport2b = {
  viewportOptions: {
    viewportId: 'viewportB',
    toolGroupId: 'default',
    allowUnmatchedView: true,
  },
  displaySets: [
    {
      matchedDisplaySetsIndex: 2,
      id: 'defaultDisplaySetId',
    },
  ],
};

const viewport1c = {
  viewportOptions: {
    viewportId: 'viewportC',
    toolGroupId: 'default',
    allowUnmatchedView: true,
  },
  displaySets: [
    {
      matchedDisplaySetsIndex: 1,
      id: 'defaultDisplaySetId',
    },
  ],
};
const viewport0d = {
  viewportOptions: {
    viewportId: 'viewportD',
    toolGroupId: 'default',
    allowUnmatchedView: true,
  },
  displaySets: [
    {
      matchedDisplaySetsIndex: 0,
      id: 'defaultDisplaySetId',
    },
  ],
};

const viewportStructure = {
  layoutType: 'grid',
  properties: {
    rows: 2,
    columns: 2,
  },
};

const viewportStructure32 = {
  layoutType: 'grid',
  properties: {
    rows: 2,
    columns: 3,
  },
};

/**
 * This hanging protocol is a test hanging protocol used to apply various
 * layouts in different positions for display, re-using earlier names in
 * various orders.
 */
const hpTestSwitch: Types.HangingProtocol.Protocol = {
  hasUpdatedPriorsInformation: false,
  id: '@ohif/mnTestSwitch',
  description: 'Has various hanging protocol grid layouts',
  name: 'Test Switch',
  protocolMatchingRules: [
    {
      id: 'OneOrMoreSeries',
      weight: 25,
      attribute: 'numberOfDisplaySetsWithImages',
      constraint: {
        greaterThan: 0,
      },
    },
  ],
  toolGroupIds: ['default'],
  displaySetSelectors: {
    defaultDisplaySetId: {
      seriesMatchingRules: [
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
    },
  },
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
  stages: [
    {
      name: '2x2 0a1b2c3d',
      viewportStructure,
      viewports: [viewport0a, viewport1b, viewport2c, viewport3d],
    },
    {
      name: '3x2 0a1b4e2c3d5f',
      viewportStructure: viewportStructure32,
      // Note the following structure simply preserves the viewportId for
      // a given screen position
      viewports: [viewport0a, viewport1b, viewport4e, viewport2c, viewport3d, viewport5f],
    },
    {
      name: '2x2 1c0d3a2b',
      viewportStructure,
      viewports: [viewport1c, viewport0d, viewport3a, viewport2b],
    },
    {
      name: '2x2 3a2b1c0d',
      viewportStructure,
      viewports: [viewport3a, viewport2b, viewport1c, viewport0d],
    },
  ],
  numberOfPriorsReferenced: -1,
};

export default hpTestSwitch;
