import { Types } from '@ohif/core';

const frameView: Types.HangingProtocol.Protocol = {
  id: '@ohif/frameView',
  description: 'Frame view for the active series',
  name: 'Frame View',
  icon: 'tool-stack-scroll',
  isPreset: true,
  toolGroupIds: ['default'],
  protocolMatchingRules: [],
  displaySetSelectors: {
    defaultDisplaySetId: {
      seriesMatchingRules: [
        {
          attribute: 'numImageFrames',
          constraint: {
            greaterThan: { value: 16 },
          },
          required: true,
        },
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
      name: 'frameView',
      id: '4x4',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 4,
          columns: 4,
        },
      },
      viewports: [
        {
          viewportOptions: {
            toolGroupId: 'default',
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 0,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 1,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 2,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 3,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 4,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 5,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 6,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 7,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 8,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 9,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 10,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 11,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 12,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 13,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 14,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 15,
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
      ],
    },
    {
      name: 'frameView',
      id: '3x3',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 3,
          columns: 3,
        },
      },
      viewports: [
        {
          viewportOptions: {
            toolGroupId: 'default',
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 0,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 1,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 2,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 3,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 4,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 5,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 6,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 7,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 8,
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
      ],
    },
    {
      name: 'frameView',
      id: '3x2',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 2,
          columns: 3,
        },
      },
      viewports: [
        {
          viewportOptions: {
            toolGroupId: 'default',
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 0,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 1,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 2,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 3,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 4,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 5,
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
      ],
    },
    {
      name: 'frameView',
      id: '2x2',
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 0,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 1,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 2,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 3,
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
      ],
    },
    {
      name: 'frameView',
      id: '1x3',
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 0,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 1,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 2,
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
      ],
    },
    {
      name: 'frameView',
      id: '1x2',
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 0,
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
            syncGroups: [
              {
                type: 'zoompan',
                id: 'zoompansync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'wlsync',
                source: true,
                target: true,
                options: {
                  syncColormap: true,
                },
              },
              {
                type: 'frameview',
                id: 'frameViewSync',
                source: true,
                target: true,
                options: {
                  viewportIndex: 1,
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
      ],
    },
  ],
};

export { frameView };
