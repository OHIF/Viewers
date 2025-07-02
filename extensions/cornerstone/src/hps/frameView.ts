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
    activeDisplaySet: {
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
      allowUnmatchedView: true,
    },
    displaySets: [
      {
        id: 'activeDisplaySet',
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
            viewportId: 'custom_R0_C0',
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
              id: 'activeDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'custom_R0_C1',
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
              id: 'activeDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'custom_R0_C2',
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
              id: 'activeDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'custom_R0_C3',
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
              id: 'activeDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'custom_R1_C0',
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
              id: 'activeDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'custom_R1_C1',
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
              id: 'activeDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'custom_R1_C2',
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
              id: 'activeDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'custom_R1_C3',
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
              id: 'activeDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'custom_R2_C0',
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
              id: 'activeDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'custom_R2_C1',
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
              id: 'activeDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'custom_R2_C2',
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
              id: 'activeDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'custom_R2_C3',
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
              id: 'activeDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'custom_R3_C0',
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
              id: 'activeDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'custom_R3_C1',
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
              id: 'activeDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'custom_R3_C2',
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
              id: 'activeDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'custom_R3_C3',
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
              id: 'activeDisplaySet',
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
              id: 'activeDisplaySet',
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
              id: 'activeDisplaySet',
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
              id: 'activeDisplaySet',
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
              id: 'activeDisplaySet',
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
              id: 'activeDisplaySet',
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
              id: 'activeDisplaySet',
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
              id: 'activeDisplaySet',
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
              id: 'activeDisplaySet',
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
              id: 'activeDisplaySet',
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
              id: 'activeDisplaySet',
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
              id: 'activeDisplaySet',
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
              id: 'activeDisplaySet',
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
              id: 'activeDisplaySet',
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
              id: 'activeDisplaySet',
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
              id: 'activeDisplaySet',
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
              id: 'activeDisplaySet',
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
              id: 'activeDisplaySet',
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
              id: 'activeDisplaySet',
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
              id: 'activeDisplaySet',
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
              id: 'activeDisplaySet',
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
              id: 'activeDisplaySet',
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
              id: 'activeDisplaySet',
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
              id: 'activeDisplaySet',
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
              id: 'activeDisplaySet',
            },
          ],
        },
      ],
    },
  ],
};

export { frameView };
