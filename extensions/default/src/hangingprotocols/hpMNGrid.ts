import { Types } from '@ohif/core';

/**
 * Sync group configuration for hydrating segmentations across viewports
 * that share the same frame of reference
 * @type {Types.HangingProtocol.SyncGroup}
 */
export const HYDRATE_SEG_SYNC_GROUP = {
  type: 'hydrateseg',
  id: 'sameFORId',
  source: true,
  target: true,
  options: {
    matchingRules: ['sameFOR'],
  },
} as const;

/**
 * This hanging protocol can be activated on the primary mode by directly
 * referencing it in a URL or by directly including it within a mode, e.g.:
 * `&hangingProtocolId=@ohif/mnGrid` added to the viewer URL
 * It is not included in the viewer mode by default.
 */
const hpMN: Types.HangingProtocol.Protocol = {
  id: '@ohif/mnGrid',
  description: 'Has various hanging protocol grid layouts',
  name: '2x2',
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
      syncGroups: [HYDRATE_SEG_SYNC_GROUP],
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
      id: '2x2',
      name: '2x2',
      stageActivation: {
        enabled: {
          minViewportsMatched: 4,
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
            allowUnmatchedView: true,
            syncGroups: [
              {
                type: 'hydrateseg',
                id: 'sameFORId',
                source: true,
                target: true,
                options: {
                  matchingRules: ['sameFOR'],
                },
              },
            ],
          },
          displaySets: [
            {
              id: 'defaultDisplaySetId',
            },
          ],
        },
        {
          viewportOptions: {
            toolGroupId: 'default',
            allowUnmatchedView: true,
          },
          displaySets: [
            {
              matchedDisplaySetsIndex: 1,
              id: 'defaultDisplaySetId',
            },
          ],
        },
        {
          viewportOptions: {
            toolGroupId: 'default',
            allowUnmatchedView: true,
            syncGroups: [
              {
                type: 'hydrateseg',
                id: 'sameFORId',
                source: true,
                target: true,
                // options: {
                //   matchingRules: ['sameFOR'],
                // },
              },
            ],
          },
          displaySets: [
            {
              matchedDisplaySetsIndex: 2,
              id: 'defaultDisplaySetId',
            },
          ],
        },
        {
          viewportOptions: {
            toolGroupId: 'default',
            allowUnmatchedView: true,
            syncGroups: [
              {
                type: 'hydrateseg',
                id: 'sameFORId',
                source: true,
                target: true,
                // options: {
                //   matchingRules: ['sameFOR'],
                // },
              },
            ],
          },
          displaySets: [
            {
              matchedDisplaySetsIndex: 3,
              id: 'defaultDisplaySetId',
            },
          ],
        },
      ],
    },

    // 3x1 stage
    {
      id: '3x1',
      // Obsolete settings:
      requiredViewports: 1,
      preferredViewports: 3,
      // New equivalent:
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
            allowUnmatchedView: true,
          },
          displaySets: [
            {
              id: 'defaultDisplaySetId',
            },
          ],
        },
        {
          viewportOptions: {
            toolGroupId: 'default',
            allowUnmatchedView: true,
          },
          displaySets: [
            {
              id: 'defaultDisplaySetId',
              matchedDisplaySetsIndex: 1,
            },
          ],
        },
        {
          viewportOptions: {
            toolGroupId: 'default',
            allowUnmatchedView: true,
          },
          displaySets: [
            {
              id: 'defaultDisplaySetId',
              matchedDisplaySetsIndex: 2,
            },
          ],
        },
      ],
    },

    // A 2x1 stage
    {
      id: '2x1',
      requiredViewports: 1,
      preferredViewports: 2,
      stageActivation: {
        enabled: {
          minViewportsMatched: 2,
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
            allowUnmatchedView: true,
          },
          displaySets: [
            {
              id: 'defaultDisplaySetId',
            },
          ],
        },
        {
          viewportOptions: {
            toolGroupId: 'default',
            allowUnmatchedView: true,
          },
          displaySets: [
            {
              matchedDisplaySetsIndex: 1,
              id: 'defaultDisplaySetId',
            },
          ],
        },
      ],
    },

    // A 1x1 stage - should be automatically activated if there is only 1 viewable instance
    {
      id: '1x1',
      requiredViewports: 1,
      preferredViewports: 1,
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
