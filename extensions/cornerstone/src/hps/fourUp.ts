export const fourUp = {
  id: 'fourUp',
  locked: true,
  name: 'fourUp',
  createdDate: '2023-03-15T10:29:44.894Z',
  modifiedDate: '2023-03-15T10:29:44.894Z',
  availableTo: {},
  editableBy: {},
  protocolMatchingRules: [],
  imageLoadStrategy: 'interleaveCenter',
  displaySetSelectors: {
    mprDisplaySet: {
      seriesMatchingRules: [
        {
          weight: 1,
          attribute: 'isReconstructable',
          constraint: {
            equals: {
              value: true,
            },
          },
          required: true,
        },
      ],
    },
  },
  stages: [
    {
      id: 'fourUpStage',
      name: 'fourUp',
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
            toolGroupId: 'mpr',
            viewportType: 'volume',
            orientation: 'axial',
            initialImageOptions: {
              preset: 'middle',
            },
            syncGroups: [
              {
                type: 'voi',
                id: 'mpr',
                source: true,
                target: true,
              },
            ],
          },
          displaySets: [
            {
              id: 'mprDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            toolGroupId: 'volume3d',
            viewportType: 'volume3d',
            orientation: 'coronal',
            customViewportProps: {
              hideOverlays: true,
            },
          },
          displaySets: [
            {
              id: 'mprDisplaySet',
              options: {
                // ToDo: choose appropriate preset
                displayPreset: 'CT-Bone',
              },
            },
          ],
        },
        {
          viewportOptions: {
            toolGroupId: 'mpr',
            viewportType: 'volume',
            orientation: 'coronal',
            initialImageOptions: {
              preset: 'middle',
            },
            syncGroups: [
              {
                type: 'voi',
                id: 'mpr',
                source: true,
                target: true,
              },
            ],
          },
          displaySets: [
            {
              id: 'mprDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            toolGroupId: 'mpr',
            viewportType: 'volume',
            orientation: 'sagittal',
            initialImageOptions: {
              preset: 'middle',
            },
            syncGroups: [
              {
                type: 'voi',
                id: 'mpr',
                source: true,
                target: true,
              },
            ],
          },
          displaySets: [
            {
              id: 'mprDisplaySet',
            },
          ],
        },
      ],
    },
  ],
};
