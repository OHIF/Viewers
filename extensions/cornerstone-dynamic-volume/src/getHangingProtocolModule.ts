const DEFAULT_COLORMAP = 'hsv';

function getPTOptions({
  colormap,
  voiInverted
}: {
  colormap?: string;
  voiInverted?: boolean;
} = { }
) {
  return {
    colormap,
    voi: {
      windowWidth: 5,
      windowCenter: 2.5,
    },
    voiInverted,
  }
}


function getPTViewports() {
  const ptOptionsParams = {
    /* colormap: DEFAULT_COLORMAP, */
    voiInverted: true,
  };

  return [
    {
      viewportOptions: {
        viewportId: 'ptAxial',
        viewportType: 'volume',
        orientation: 'axial',
        background: [1, 1, 1],
        toolGroupId: 'dynamic4D-default',
        initialImageOptions: {
          preset: 'middle', // 'first', 'last', 'middle'
        },
        syncGroups: [
          {
            type: 'cameraPosition',
            id: 'axialSync',
            source: true,
            target: true,
          },
          {
            type: 'voi',
            id: 'ptWLSync',
            source: true,
            target: true,
          },
        ],
      },
      displaySets: [
        {
          id: 'ptDisplaySet',
          options: { ...getPTOptions(ptOptionsParams) },
        },
      ],
    },
    {
      viewportOptions: {
        viewportId: 'ptSagittal',
        viewportType: 'volume',
        orientation: 'sagittal',
        background: [1, 1, 1],
        toolGroupId: 'dynamic4D-default',
        initialImageOptions: {
          // preset: 'middle', // 'first', 'last', 'middle'
          index: 140,
        },
        syncGroups: [
          {
            type: 'cameraPosition',
            id: 'sagittalSync',
            source: true,
            target: true,
          },
          {
            type: 'voi',
            id: 'ptWLSync',
            source: true,
            target: true,
          },
        ],
      },
      displaySets: [
        {
          id: 'ptDisplaySet',
          options: { ...getPTOptions(ptOptionsParams) },
        },
      ],
    },
    {
      viewportOptions: {
        viewportId: 'ptCoronal',
        viewportType: 'volume',
        orientation: 'coronal',
        background: [1, 1, 1],
        toolGroupId: 'dynamic4D-default',
        initialImageOptions: {
          // preset: 'middle', // 'first', 'last', 'middle'
          index: 160,
        },
        syncGroups: [
          {
            type: 'cameraPosition',
            id: 'coronalSync',
            source: true,
            target: true,
          },
          {
            type: 'voi',
            id: 'ptWLSync',
            source: true,
            target: true,
          },
        ],
      },
      displaySets: [
        {
          id: 'ptDisplaySet',
          options: { ...getPTOptions(ptOptionsParams) },
        },
      ],
    }
  ]
}

function getFusionViewports() {
  const ptOptionsParams = { colormap: DEFAULT_COLORMAP };

  return [
    {
      viewportOptions: {
        viewportId: 'fusionAxial',
        viewportType: 'volume',
        orientation: 'axial',
        toolGroupId: 'dynamic4D-fusion',
        initialImageOptions: {
          preset: 'middle', // 'first', 'last', 'middle'
        },
        syncGroups: [
          {
            type: 'cameraPosition',
            id: 'axialSync',
            source: true,
            target: true,
          },
          {
            type: 'voi',
            id: 'ptWLSync',
            source: true,
            target: true,
          },
          {
            type: 'voi',
            id: 'ptFusionWLSync',
            source: true,
            target: false,
          },
        ],
      },
      displaySets: [
        {
          id: 'ctDisplaySet',
        },
        {
          options: { ...getPTOptions(ptOptionsParams) },
          id: 'ptDisplaySet',
        },
      ],
    },
    {
      viewportOptions: {
        viewportId: 'fusionSagittal',
        viewportType: 'volume',
        orientation: 'sagittal',
        toolGroupId: 'dynamic4D-fusion',
        initialImageOptions: {
          // preset: 'middle', // 'first', 'last', 'middle'
          index: 600,
        },
        syncGroups: [
          {
            type: 'cameraPosition',
            id: 'sagittalSync',
            source: true,
            target: true,
          },
          {
            type: 'voi',
            id: 'ptWLSync',
            source: true,
            target: true,
          },
          {
            type: 'voi',
            id: 'ptFusionWLSync',
            source: true,
            target: false,
          },
        ],
      },
      displaySets: [
        {
          id: 'ctDisplaySet',
        },
        {
          options: { ...getPTOptions(ptOptionsParams) },
          id: 'ptDisplaySet',
        },
      ],
    },
    {
      viewportOptions: {
        viewportId: 'fusionCoronal',
        viewportType: 'volume',
        orientation: 'coronal',
        toolGroupId: 'dynamic4D-fusion',
        initialImageOptions: {
          // preset: 'middle', // 'first', 'last', 'middle'
          index: 600,
        },
        syncGroups: [
          {
            type: 'cameraPosition',
            id: 'coronalSync',
            source: true,
            target: true,
          },
          {
            type: 'voi',
            id: 'ptWLSync',
            source: true,
            target: true,
          },
          {
            type: 'voi',
            id: 'ptFusionWLSync',
            source: true,
            target: false,
          },
        ],
      },
      displaySets: [
        {
          id: 'ctDisplaySet',
        },
        {
          options: { ...getPTOptions(ptOptionsParams) },
          id: 'ptDisplaySet',
        },
      ],
    },
  ];
}

const defaultProtocol = {
  id: 'default4D',
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
  imageLoadStrategy: 'interleaveTopToBottom', // "default" , "interleaveTopToBottom",  "interleaveCenter"
  protocolMatchingRules: [
    {
      attribute: 'ModalitiesInStudy',
      constraint: {
        contains: ['CT', 'PT'],
      },
    },
  ],
  toolGroupIds: ['dynamic4D-default'],
  // -1 would be used to indicate active only, whereas other values are
  // the number of required priors referenced - so 0 means active with
  // 0 or more priors.
  numberOfPriorsReferenced: 0,
  // Default viewport is used to define the viewport when
  // additional viewports are added using the layout tool
  defaultViewport: {
    viewportOptions: {
      viewportType: 'volume',
      toolGroupId: 'dynamic4D-default',
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
      ],
      // Can be used to select matching studies
      // studyMatchingRules: [],
    },
  },
  stages: [
    {
      id: 'dataPreparation',
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

    {
      id: 'registration',
      name: 'Registration',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 2,
          columns: 3,
        },
      },
      viewports: [
        ...getFusionViewports(),
        ...getPTViewports(),
      ],
      createdDate: '2023-01-01T00:00:00.000Z',
    },

    {
      id: 'review',
      name: 'Review',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 1,
          columns: 3,
        },
      },
      viewports: [
        ...getFusionViewports(),
      ],
      createdDate: '2023-01-01T00:00:00.000Z',
    },

    {
      id: 'roiQuantification',
      name: 'ROI Quantification',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 1,
          columns: 3,
        },
      },
      viewports: [
        ...getFusionViewports(),
      ],
      createdDate: '2023-01-01T00:00:00.000Z',
    },

    {
      id: 'kinectAnalysis',
      name: 'Kinect Analysis',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 1,
          columns: 3,
        },
      },
      viewports: [
        ...getPTViewports()
      ],
      createdDate: '2023-01-01T00:00:00.000Z',
    },
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
      name: defaultProtocol.id,
      protocol: defaultProtocol,
    },
  ];
}

export default getHangingProtocolModule;
