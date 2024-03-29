const DEFAULT_COLORMAP = '2hot';
const toolGroupIds = {
  pt: 'dynamic4D-pt',
  fusion: 'dynamic4D-fusion',
  ct: 'dynamic4D-ct',
};

function getPTOptions({
  colormap,
  voiInverted,
}: {
  colormap?: {
    name: string;
    opacity:
      | number
      | {
          value: number;
          opacity: number;
        }[];
  };
  voiInverted?: boolean;
} = {}) {
  return {
    blendMode: 'MIP',
    colormap,
    voi: {
      windowWidth: 5,
      windowCenter: 2.5,
    },
    voiInverted,
  };
}

function getPTViewports() {
  const ptOptionsParams = {
    colormap: {
      name: DEFAULT_COLORMAP,
      opacity: [
        { value: 0, opacity: 0 },
        { value: 0.1, opacity: 1 },
        { value: 1, opacity: 1 },
      ],
    },
    voiInverted: false,
  };

  return [
    {
      viewportOptions: {
        viewportId: 'ptAxial',
        viewportType: 'volume',
        orientation: 'axial',
        toolGroupId: toolGroupIds.pt,
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
        toolGroupId: toolGroupIds.pt,
        initialImageOptions: {
          preset: 'middle', // 'first', 'last', 'middle'
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
        toolGroupId: toolGroupIds.pt,
        initialImageOptions: {
          preset: 'middle', // 'first', 'last', 'middle'
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
    },
  ];
}

function getFusionViewports() {
  const ptOptionsParams = {
    colormap: {
      name: DEFAULT_COLORMAP,
      opacity: [
        { value: 0, opacity: 0 },
        { value: 0.1, opacity: 0.3 },
        { value: 1, opacity: 0.3 },
      ],
    },
  };

  return [
    {
      viewportOptions: {
        viewportId: 'fusionAxial',
        viewportType: 'volume',
        orientation: 'axial',
        toolGroupId: toolGroupIds.fusion,
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
            id: 'ctWLSync',
            source: false,
            target: true,
          },
          {
            type: 'voi',
            id: 'fusionWLSync',
            source: true,
            target: true,
          },
          {
            type: 'voi',
            id: 'ptFusionWLSync',
            source: false,
            target: true,
            options: {
              syncInvertState: false,
            },
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
        toolGroupId: toolGroupIds.fusion,
        initialImageOptions: {
          preset: 'middle', // 'first', 'last', 'middle'
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
            id: 'ctWLSync',
            source: false,
            target: true,
          },
          {
            type: 'voi',
            id: 'fusionWLSync',
            source: true,
            target: true,
          },
          {
            type: 'voi',
            id: 'ptFusionWLSync',
            source: false,
            target: true,
            options: {
              syncInvertState: false,
            },
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
        toolGroupId: toolGroupIds.fusion,
        initialImageOptions: {
          preset: 'middle', // 'first', 'last', 'middle'
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
            id: 'ctWLSync',
            source: false,
            target: true,
          },
          {
            type: 'voi',
            id: 'fusionWLSync',
            source: true,
            target: true,
          },
          {
            type: 'voi',
            id: 'ptFusionWLSync',
            source: false,
            target: true,
            options: {
              syncInvertState: false,
            },
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

function getSeriesChartViewport() {
  return {
    viewportOptions: {
      viewportId: 'seriesChart',
    },
    displaySets: [
      {
        id: 'chartDisplaySet',
        options: {
          // This dataset does not require the download of any instance since it is pre-computed locally,
          // but interleaveTopToBottom.ts was not loading any series because it consider that all viewports
          // are a Cornerstone viewport which is not true in this case and it waits for all viewports to
          // have called interleaveTopToBottom(...).
          skipLoading: true,
        },
      },
    ],
  };
}

function getCTViewports() {
  return [
    {
      viewportOptions: {
        viewportId: 'ctAxial',
        viewportType: 'volume',
        orientation: 'axial',
        toolGroupId: toolGroupIds.ct,
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
            id: 'ctWLSync',
            source: true,
            target: true,
          },
        ],
      },
      displaySets: [
        {
          id: 'ctDisplaySet',
        },
      ],
    },
    {
      viewportOptions: {
        viewportId: 'ctSagittal',
        viewportType: 'volume',
        orientation: 'sagittal',
        toolGroupId: toolGroupIds.ct,
        initialImageOptions: {
          preset: 'middle',
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
            id: 'ctWLSync',
            source: true,
            target: true,
          },
        ],
      },
      displaySets: [
        {
          id: 'ctDisplaySet',
        },
      ],
    },
    {
      viewportOptions: {
        viewportId: 'ctCoronal',
        viewportType: 'volume',
        orientation: 'coronal',
        toolGroupId: toolGroupIds.ct,
        initialImageOptions: {
          preset: 'middle',
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
            id: 'ctWLSync',
            source: true,
            target: true,
          },
        ],
      },
      displaySets: [
        {
          id: 'ctDisplaySet',
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
  imageLoadStrategy: 'default', // "default" , "interleaveTopToBottom",  "interleaveCenter"
  protocolMatchingRules: [
    {
      attribute: 'ModalitiesInStudy',
      constraint: {
        contains: ['CT', 'PT'],
      },
    },
  ],
  // -1 would be used to indicate active only, whereas other values are
  // the number of required priors referenced - so 0 means active with
  // 0 or more priors.
  numberOfPriorsReferenced: -1,
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
    chartDisplaySet: {
      // Unused currently
      imageMatchingRules: [],
      // Matches displaysets, NOT series
      seriesMatchingRules: [
        {
          attribute: 'Modality',
          constraint: {
            equals: {
              value: 'CHT',
            },
          },
          required: true,
        },
      ],
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
      viewports: [...getPTViewports()],
      createdDate: '2023-01-01T00:00:00.000Z',
    },

    {
      id: 'registration',
      name: 'Registration',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 3,
          columns: 3,
        },
      },
      viewports: [...getFusionViewports(), ...getCTViewports(), ...getPTViewports()],
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
      viewports: [...getFusionViewports()],
      createdDate: '2023-01-01T00:00:00.000Z',
    },

    {
      id: 'kineticAnalysis',
      name: 'Kinetic Analysis',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 2,
          columns: 3,
          layoutOptions: [
            {
              x: 0,
              y: 0,
              width: 1 / 3,
              height: 1 / 2,
            },
            {
              x: 1 / 3,
              y: 0,
              width: 1 / 3,
              height: 1 / 2,
            },
            {
              x: 2 / 3,
              y: 0,
              width: 1 / 3,
              height: 1 / 2,
            },
            {
              x: 0,
              y: 1 / 2,
              width: 1,
              height: 1 / 2,
            },
          ],
        },
      },
      viewports: [...getFusionViewports(), getSeriesChartViewport()],
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
