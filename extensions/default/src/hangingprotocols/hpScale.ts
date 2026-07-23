import { Types } from '@ohif/core';

const displayAreaScale1: Types.HangingProtocol.DisplayArea = {
  type: 'SCALE',
  scale: 1,
  storeAsInitialCamera: true,
};
const displayAreaScale15: Types.HangingProtocol.DisplayArea = { ...displayAreaScale1, scale: 15 };

/**
 * This hanging protocol can be activated on the primary mode by directly
 * referencing it in a URL or by directly including it within a mode, e.g.:
 * `&hangingProtocolId=@ohif/mnGrid` added to the viewer URL
 * It is not included in the viewer mode by default.
 */
const hpScale: Types.HangingProtocol.Protocol = {
  id: '@ohif/hpScale',
  description: 'Has various hanging protocol grid layouts',
  name: 'Scale Images',
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
          weight: 1,
          attribute: 'numImageFrames',
          constraint: {
            greaterThan: { value: 0 },
          },
          required: true,
        },
        // This display set will select the specified items by preference
        // It has no affect if nothing is specified in the URL.
        {
          attribute: 'isDisplaySetFromUrl',
          weight: 20,
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
      displayArea: displayAreaScale1,
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
    // A 1x1 stage - should be automatically activated if there is only 1 viewable instance
    {
      name: 'Scale 1:1',
      stageActivation: {
        enabled: {
          minViewportsMatched: 1,
        },
      },
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
            toolGroupId: 'default',
            allowUnmatchedView: true,
            displayArea: displayAreaScale1,
          },
          displaySets: [
            {
              id: 'defaultDisplaySetId',
            },
          ],
        },
      ],
    },
    {
      name: 'Scale 1:15',
      stageActivation: {
        enabled: {
          minViewportsMatched: 1,
        },
      },
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
            toolGroupId: 'default',
            allowUnmatchedView: true,
            displayArea: displayAreaScale15,
          },
          displaySets: [
            {
              id: 'defaultDisplaySetId',
            },
          ],
        },
      ],
    },
  ],
  numberOfPriorsReferenced: -1,
};

export default hpScale;
