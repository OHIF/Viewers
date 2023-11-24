import {
  RCC,
  RMLO,
  LCC,
  LMLO,
  RCCPrior,
  LCCPrior,
  RMLOPrior,
  LMLOPrior,
} from './mammoDisplaySetSelector';

const rightDisplayArea = {
  storeAsInitialCamera: true,
  imageArea: [0.7, 0.7],
  imageCanvasPoint: {
    imagePoint: [0, 0.5],
    canvasPoint: [-0.08, 0.5],
  },
};

const leftDisplayArea = {
  storeAsInitialCamera: true,
  imageArea: [0.7, 0.7],
  imageCanvasPoint: {
    imagePoint: [1, 0.5],
    canvasPoint: [1.08, 0.5],
  },
};

const hpMammo = {
  id: '@ohif/hpMammo',
  hasUpdatedPriorsInformation: false,
  name: 'Mammography Breast Screening',
  availableTo: {},
  editableBy: {},
  protocolMatchingRules: [
    {
      id: 'Mammography',
      weight: 150,
      attribute: 'ModalitiesInStudy',
      constraint: {
        contains: 'MG',
      },
      required: true,
    },
    {
      id: 'numberOfImages',
      attribute: 'numberOfDisplaySetsWithImages',
      constraint: {
        greaterThan: 2,
      },
      required: true,
    },
  ],
  toolGroupIds: ['default'],
  displaySetSelectors: {
    RCC,
    LCC,
    RMLO,
    LMLO,
    RCCPrior,
    LCCPrior,
    RMLOPrior,
    LMLOPrior,
  },

  stages: [
    {
      name: 'CC/MLO',
      viewportStructure: {
        type: 'grid',
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
            displayArea: leftDisplayArea,
            flip: true,
            rotation: 180,
          },
          displaySets: [
            {
              id: 'RCC',
            },
          ],
        },
        {
          viewportOptions: {
            toolGroupId: 'default',
            flip: true,
            displayArea: rightDisplayArea,
          },
          displaySets: [
            {
              id: 'LCC',
            },
          ],
        },
        {
          viewportOptions: {
            toolGroupId: 'default',
            displayArea: leftDisplayArea,
            rotation: 180,
            flip: true,
          },
          displaySets: [
            {
              id: 'RMLO',
            },
          ],
        },
        {
          viewportOptions: {
            toolGroupId: 'default',
            displayArea: rightDisplayArea,
            flip: true,
          },
          displaySets: [
            {
              id: 'LMLO',
            },
          ],
        },
      ],
    },

    // Compare CC current/prior top/bottom
    {
      name: 'CC compare',
      viewportStructure: {
        type: 'grid',
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
            displayArea: leftDisplayArea,
            flip: true,
            rotation: 180,
          },
          displaySets: [
            {
              id: 'RCC',
            },
          ],
        },
        {
          viewportOptions: {
            toolGroupId: 'default',
            flip: true,
            displayArea: rightDisplayArea,
          },
          displaySets: [
            {
              id: 'LCC',
            },
          ],
        },
        {
          viewportOptions: {
            toolGroupId: 'default',
            displayArea: leftDisplayArea,
            flip: true,
          },
          displaySets: [
            {
              id: 'RCCPrior',
            },
          ],
        },
        {
          viewportOptions: {
            toolGroupId: 'default',
            displayArea: rightDisplayArea,
          },
          displaySets: [
            {
              id: 'LCCPrior',
            },
          ],
        },
      ],
    },
  ],
  // Indicates it is prior aware, but will work with no priors
  numberOfPriorsReferenced: 0,
};

export default hpMammo;
