const DEFAULT_PT_OPTIONS = {
  colormap: 'hsv',
  voi: {
    windowWidth: 5,
    windowCenter: 2.5,
  },
  // voiInverted: true,
};


function getPTViewports() {
  return [
    {
      viewportOptions: {
        viewportId: 'ptAxial',
        viewportType: 'volume',
        orientation: 'axial',
        // background: [1, 1, 1],
        toolGroupId: 'default',
        initialImageOptions: {
          preset: 'middle', // 'first', 'last', 'middle'
        },
      },
      displaySets: [
        {
          id: 'ptDisplaySet',
          options: { ...DEFAULT_PT_OPTIONS },
        },
      ],
    },
    {
      viewportOptions: {
        viewportId: 'ptSagittal',
        viewportType: 'volume',
        orientation: 'sagittal',
        toolGroupId: 'default',
        initialImageOptions: {
          preset: 'middle', // 'first', 'last', 'middle'
        },
      },
      displaySets: [
        {
          id: 'ptDisplaySet',
          options: { ...DEFAULT_PT_OPTIONS },
        },
      ],
    },
    {
      viewportOptions: {
        viewportId: 'ptCoronal',
        viewportType: 'volume',
        orientation: 'coronal',
        toolGroupId: 'default',
        initialImageOptions: {
          preset: 'middle', // 'first', 'last', 'middle'
        },
      },
      displaySets: [
        {
          id: 'ptDisplaySet',
          options: { ...DEFAULT_PT_OPTIONS },
        },
      ],
    }
  ]
}

function getFusionViewports() {
  return [
    {
      viewportOptions: {
        viewportId: 'fusionAxial',
        viewportType: 'volume',
        orientation: 'axial',
        toolGroupId: 'default',
        initialImageOptions: {
          preset: 'middle', // 'first', 'last', 'middle'
        },
      },
      displaySets: [
        {
          id: 'ctDisplaySet',
        },
        {
          options: { ...DEFAULT_PT_OPTIONS },
          id: 'ptDisplaySet',
        },
      ],
    },
    {
      viewportOptions: {
        viewportId: 'fusionSagittal',
        viewportType: 'volume',
        orientation: 'sagittal',
        toolGroupId: 'default',
        initialImageOptions: {
          preset: 'middle', // 'first', 'last', 'middle'
        },
      },
      displaySets: [
        {
          id: 'ctDisplaySet',
        },
        {
          options: { ...DEFAULT_PT_OPTIONS },
          id: 'ptDisplaySet',
        },
      ],
    },
    {
      viewportOptions: {
        viewportId: 'fusionCoronal',
        viewportType: 'volume',
        orientation: 'coronal',
        toolGroupId: 'default',
        initialImageOptions: {
          preset: 'middle', // 'first', 'last', 'middle'
        },
      },
      displaySets: [
        {
          id: 'ctDisplaySet',
        },
        {
          options: { ...DEFAULT_PT_OPTIONS },
          id: 'ptDisplaySet',
        },
      ],
    },
  ];
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
    ctDisplaySet: {
      // Unused currently
      imageMatchingRules: [],
      // Matches displaysets, NOT series
      seriesMatchingRules: [
        {
          attribute: 'Modality',
          constraint: {
            equals: {
              value: 'CT',
            },
          },
          required: true,
        },
        {
          attribute: 'isReconstructable',
          constraint: {
            equals: {
              value: true,
            },
          },
          required: true,
        },

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
    ptDisplaySet: {
      // Unused currently
      imageMatchingRules: [],
      // Matches displaysets, NOT series
      seriesMatchingRules: [
        {
          attribute: 'Modality',
          constraint: {
            equals: 'PT',
          },
          required: true,
        },
        {
          attribute: 'isReconstructable',
          constraint: {
            equals: {
              value: true,
            },
          },
          required: true,
        },
        {
          attribute: 'SeriesDescription',
          constraint: {
            contains: 'Corrected',
          },
        },
        {
          weight: 2,
          attribute: 'SeriesDescription',
          constraint: {
            doesNotContain: {
              value: 'Uncorrected',
            },
          },
        },

        // Should we check if CorrectedImage contains ATTN?
        // (0028,0051) (CorrectedImage): NORM\DTIM\ATTN\SCAT\RADL\DECY

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
        ...getPTViewports(),
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
    //     ...getFusionViewports(),
    //     ...getPTViewports(),
    //   ],
    //   createdDate: '2023-01-01T00:00:00.000Z',
    // },

    // {
    //   name: 'Review',
    //   viewportStructure: {
    //     layoutType: 'grid',
    //     properties: {
    //       rows: 1,
    //       columns: 3,
    //     },
    //   },
    //   viewports: [
    //     ...getFusionViewports(),
    //   ],
    //   createdDate: '2023-01-01T00:00:00.000Z',
    // },

    // {
    //   name: 'ROI Quantification',
    //   viewportStructure: {
    //     layoutType: 'grid',
    //     properties: {
    //       rows: 1,
    //       columns: 3,
    //     },
    //   },
    //   viewports: [
    //     ...getFusionViewports(),
    //   ],
    //   createdDate: '2023-01-01T00:00:00.000Z',
    // },

    // {
    //   name: 'Kinect Analysis',
    //   viewportStructure: {
    //     layoutType: 'grid',
    //     properties: {
    //       rows: 1,
    //       columns: 3,
    //     },
    //   },
    //   viewports: [
    //     ...getPTViewports()
    //   ],
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
