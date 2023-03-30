function volumeDisplaySetMatcher() {

}

const defaultProtocol = {
  id: 'default',
  locked: true,
  // Don't store this hanging protocol as it applies to the currently active
  // display set by default
  // cacheId: null,
  hasUpdatedPriorsInformation: false,
  name: 'Default',
  createdDate: '2023-01-01T00:00:00.000Z',
  modifiedDate: '2023-01-01T00:00:00.000Z',
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
      viewportType: 'volume',
      toolGroupId: 'default',
      allowUnmatchedView: true,
      initialImageOptions: {
        preset: 'middle', // 'first', 'last', 'middle'
      },
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
      // Unused currently
      imageMatchingRules: [],
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
      ],
      // Can be used to select matching studies
      // studyMatchingRules: [],
    },
    ctDisplaySetId: {
      // Unused currently
      imageMatchingRules: [],
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

        {
          attribute: 'Modality',
          constraint: {
            format: {
              pattern: '^CT$',
              flags: 'i'
            },
          },
        },
      ],
      // Can be used to select matching studies
      // studyMatchingRules: [],
    },
    ptDisplaySetId: {
      // Unused currently
      imageMatchingRules: [],
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

        {
          attribute: 'Modality',
          constraint: {
            format: {
              pattern: '^PT$',
              flags: 'i'
            },
          },
        },

        // 0028,0051 (CorrectedImage): NORM\DTIM\ATTN\SCAT\RADL\DECY
        // {
        //   attribute: 'Modality',
        //   // weight: 10
        //   constraint: {
        //     format: {
        //       pattern: '^PT$',
        //       flags: 'i'
        //     },
        //   },
        // },
      ],
      // Can be used to select matching studies
      // studyMatchingRules: [],
    },
  },
  stages: [
    {
      name: 'Data Preparation',
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
            viewportType: 'volume',
            orientation: 'axial',
            toolGroupId: 'default',
            initialImageOptions: {
              preset: 'middle', // 'first', 'last', 'middle'
            },
          },
          displaySets: [
            {
              id: 'ptDisplaySetId',
            },
          ],
        },
        {
          viewportOptions: {
            viewportType: 'volume',
            orientation: 'coronal',
            toolGroupId: 'default',
            initialImageOptions: {
              preset: 'middle', // 'first', 'last', 'middle'
            },
          },
          displaySets: [
            {
              id: 'ptDisplaySetId',
            },
          ],
        },
        {
          viewportOptions: {
            viewportType: 'volume',
            orientation: 'sagittal',
            toolGroupId: 'default',
            initialImageOptions: {
              preset: 'middle', // 'first', 'last', 'middle'
            },
          },
          displaySets: [
            {
              id: 'ptDisplaySetId',
            },
          ],
        },
      ],
      createdDate: '2023-01-01T00:00:00.000Z',
    },

    // {
    //   name: 'Registration',
    //   viewportStructure: {
    //     layoutType: 'grid',
    //     properties: {
    //       rows: 2,
    //       columns: 3,
    //     },
    //   },
    //   viewports: [
    //     {
    //       viewportOptions: {
    //         viewportType: 'volume',
    //         orientation: 'axial',
    //         toolGroupId: 'default',
    //         initialImageOptions: {
    //           preset: 'middle', // 'first', 'last', 'middle'
    //         },
    //       },
    //       displaySets: [
    //         {
    //           id: 'ctDisplaySetId',
    //         },
    //       ],
    //     },
    //     {
    //       viewportOptions: {
    //         viewportType: 'volume',
    //         orientation: 'coronal',
    //         toolGroupId: 'default',
    //         initialImageOptions: {
    //           preset: 'middle', // 'first', 'last', 'middle'
    //         },
    //       },
    //       displaySets: [
    //         {
    //           id: 'ctDisplaySetId',
    //         },
    //       ],
    //     },
    //     {
    //       viewportOptions: {
    //         viewportType: 'volume',
    //         orientation: 'sagittal',
    //         toolGroupId: 'default',
    //         initialImageOptions: {
    //           preset: 'middle', // 'first', 'last', 'middle'
    //         },
    //       },
    //       displaySets: [
    //         {
    //           id: 'ctDisplaySetId',
    //         },
    //       ],
    //     },
    //     {
    //       viewportOptions: {
    //         viewportType: 'volume',
    //         orientation: 'axial',
    //         toolGroupId: 'default',
    //         initialImageOptions: {
    //           preset: 'middle', // 'first', 'last', 'middle'
    //         },
    //       },
    //       displaySets: [
    //         {
    //           id: 'ptDisplaySetId',
    //         },
    //       ],
    //     },
    //     {
    //       viewportOptions: {
    //         viewportType: 'volume',
    //         orientation: 'coronal',
    //         toolGroupId: 'default',
    //         initialImageOptions: {
    //           preset: 'middle', // 'first', 'last', 'middle'
    //         },
    //       },
    //       displaySets: [
    //         {
    //           id: 'ptDisplaySetId',
    //         },
    //       ],
    //     },
    //     {
    //       viewportOptions: {
    //         viewportType: 'volume',
    //         orientation: 'sagittal',
    //         toolGroupId: 'default',
    //         initialImageOptions: {
    //           preset: 'middle', // 'first', 'last', 'middle'
    //         },
    //       },
    //       displaySets: [
    //         {
    //           id: 'ptDisplaySetId',
    //         },
    //       ],
    //     },
    //   ],
    //   createdDate: '2023-01-01T00:00:00.000Z',
    // },

    // {
    //   name: 'Review',
    //   viewportStructure: {
    //     layoutType: 'grid',
    //     properties: {
    //       rows: 2,
    //       columns: 3,
    //     },
    //   },
    //   viewports: [],
    //   createdDate: '2023-01-01T00:00:00.000Z',
    // },

    // {
    //   name: 'ROI Quantification',
    //   viewportStructure: {
    //     layoutType: 'grid',
    //     properties: {
    //       rows: 2,
    //       columns: 3,
    //     },
    //   },
    //   viewports: [],
    //   createdDate: '2023-01-01T00:00:00.000Z',
    // },

    // {
    //   name: 'Kinetic Analysis',
    //   viewportStructure: {
    //     layoutType: 'grid',
    //     properties: {
    //       rows: 2,
    //       columns: 3,
    //     },
    //   },
    //   viewports: [],
    //   createdDate: '2023-01-01T00:00:00.000Z',
    // },
  ],
};

/**
   * HangingProtocolModule should provide a list of hanging protocols that will be
   * available in OHIF for Modes to use to decide on the structure of the viewports
   * and also the series that hung in the viewports. Each hanging protocol is defined by
   * { name, protocols}. Examples include the default hanging protocol provided by
   * the default extension that shows 2x2 viewports.
   */

function getHangingProtocolModule() {
  return [
    {
      id: defaultProtocol.id,
      protocol: defaultProtocol,
    },
  ];
}

export default getHangingProtocolModule;
