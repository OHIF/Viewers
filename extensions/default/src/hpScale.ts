import { Types } from '@ohif/core';

/**
 * This hanging protocol can be activated on the primary mode by directly
 * referencing it in a URL or by directly including it within a mode, e.g.:
 * `&hangingProtocolId=@ohif/mnGrid` added to the viewer URL
 * It is not included in the viewer mode by default.
 */
const hpMN: Types.HangingProtocol.Protocol = {
  id: 'hpScale',
  description: 'Has pixel scaling layouts',
  name: 'PixelScale',
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
          required: true,
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
            displayArea: {
              type: 'SCALE',
              scale: 1.0,
            },
            background: [0, 0, 0.15],
          },
          displaySets: [
            {
              id: 'defaultDisplaySetId',
            },
          ],
        },
      ],
    },

    // A scale up to 8:8
    {
      name: 'Scale 8:8',
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
            id: '8x8',
            toolGroupId: 'default',
            allowUnmatchedView: true,
            interpolationType: 0,
            displayArea: {
              type: 'SCALE',
              scale: 8.0,
            },
            background: [0, 0.25, 0],
          },
          displaySets: [
            {
              id: 'defaultDisplaySetId',
            },
          ],
        },
      ],
    },

    // A scale up to 8:8
    {
      name: 'Scale 8:8',
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
            id: '32x32',
            toolGroupId: 'default',
            allowUnmatchedView: true,
            interpolationType: 0,
            displayArea: {
              type: 'SCALE',
              scale: 32.0,
            },
            background: [0, 0.1, 0.1],
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

export default hpMN;
