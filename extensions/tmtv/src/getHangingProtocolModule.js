import {
  ctAXIAL,
  ctCORONAL,
  ctSAGITTAL,
  fusionAXIAL,
  fusionCORONAL,
  fusionSAGITTAL,
  mipSAGITTAL,
  ptAXIAL,
  ptCORONAL,
  ptSAGITTAL,
} from './utils/hpViewports';

/**
 * represents a 3x4 viewport layout configuration. The layout displays CT axial, sagittal, and coronal
 * images in the first row, PT axial, sagittal, and coronal images in the second row, and fusion axial,
 * sagittal, and coronal images in the third row. The fourth column is fully spanned by a MIP sagittal
 * image, covering all three rows. It has synchronizers for windowLevel for all CT and PT images, and
 * also camera synchronizer for each orientation
 */
const stage1 = {
  name: 'default',
  viewportStructure: {
    layoutType: 'grid',
    properties: {
      rows: 3,
      columns: 4,
      layoutOptions: [
        {
          x: 0,
          y: 0,
          width: 1 / 4,
          height: 1 / 3,
        },
        {
          x: 1 / 4,
          y: 0,
          width: 1 / 4,
          height: 1 / 3,
        },
        {
          x: 2 / 4,
          y: 0,
          width: 1 / 4,
          height: 1 / 3,
        },
        {
          x: 0,
          y: 1 / 3,
          width: 1 / 4,
          height: 1 / 3,
        },
        {
          x: 1 / 4,
          y: 1 / 3,
          width: 1 / 4,
          height: 1 / 3,
        },
        {
          x: 2 / 4,
          y: 1 / 3,
          width: 1 / 4,
          height: 1 / 3,
        },
        {
          x: 0,
          y: 2 / 3,
          width: 1 / 4,
          height: 1 / 3,
        },
        {
          x: 1 / 4,
          y: 2 / 3,
          width: 1 / 4,
          height: 1 / 3,
        },
        {
          x: 2 / 4,
          y: 2 / 3,
          width: 1 / 4,
          height: 1 / 3,
        },
        {
          x: 3 / 4,
          y: 0,
          width: 1 / 4,
          height: 1,
        },
      ],
    },
  },
  viewports: [
    ctAXIAL,
    ctSAGITTAL,
    ctCORONAL,
    ptAXIAL,
    ptSAGITTAL,
    ptCORONAL,
    fusionAXIAL,
    fusionSAGITTAL,
    fusionCORONAL,
    mipSAGITTAL,
  ],
  createdDate: '2021-02-23T18:32:42.850Z',
};

/**
 * The layout displays CT axial image in the top-left viewport, fusion axial image
 * in the top-right viewport, PT axial image in the bottom-left viewport, and MIP
 * sagittal image in the bottom-right viewport. The layout follows a simple grid
 * pattern with 2 rows and 2 columns. It includes synchronizers as well.
 */
const stage2 = {
  name: 'Fusion 2x2',
  viewportStructure: {
    layoutType: 'grid',
    properties: {
      rows: 2,
      columns: 2,
    },
  },
  viewports: [ctAXIAL, fusionAXIAL, ptAXIAL, mipSAGITTAL],
};

/**
 * The top row displays CT images in axial, sagittal, and coronal orientations from
 * left to right, respectively. The bottom row displays PT images in axial, sagittal,
 * and coronal orientations from left to right, respectively.
 * The layout follows a simple grid pattern with 2 rows and 3 columns.
 * It includes synchronizers as well.
 */
const stage3 = {
  name: '2x3-layout',
  viewportStructure: {
    layoutType: 'grid',
    properties: {
      rows: 2,
      columns: 3,
    },
  },
  viewports: [ctAXIAL, ctSAGITTAL, ctCORONAL, ptAXIAL, ptSAGITTAL, ptCORONAL],
};

/**
 * In this layout, the top row displays PT images in coronal, sagittal, and axial
 * orientations from left to right, respectively, followed by a MIP sagittal image
 * that spans both rows on the rightmost side. The bottom row displays fusion images
 * in coronal, sagittal, and axial orientations from left to right, respectively.
 * There is no viewport in the bottom row's rightmost position, as the MIP sagittal viewport
 * from the top row spans the full height of both rows.
 * It includes synchronizers as well.
 */
const stage4 = {
  name: '2x4-layout',
  viewportStructure: {
    layoutType: 'grid',
    properties: {
      rows: 2,
      columns: 4,
      layoutOptions: [
        {
          x: 0,
          y: 0,
          width: 1 / 4,
          height: 1 / 2,
        },
        {
          x: 1 / 4,
          y: 0,
          width: 1 / 4,
          height: 1 / 2,
        },
        {
          x: 2 / 4,
          y: 0,
          width: 1 / 4,
          height: 1 / 2,
        },
        {
          x: 3 / 4,
          y: 0,
          width: 1 / 4,
          height: 1,
        },
        {
          x: 0,
          y: 1 / 2,
          width: 1 / 4,
          height: 1 / 2,
        },
        {
          x: 1 / 4,
          y: 1 / 2,
          width: 1 / 4,
          height: 1 / 2,
        },
        {
          x: 2 / 4,
          y: 1 / 2,
          width: 1 / 4,
          height: 1 / 2,
        },
      ],
    },
  },
  viewports: [
    ptCORONAL,
    ptSAGITTAL,
    ptAXIAL,
    mipSAGITTAL,
    fusionCORONAL,
    fusionSAGITTAL,
    fusionAXIAL,
  ],
};

const ptCT = {
  id: '@ohif/extension-tmtv.hangingProtocolModule.ptCT',
  locked: true,
  name: 'Default',
  createdDate: '2021-02-23T19:22:08.894Z',
  modifiedDate: '2022-10-04T19:22:08.894Z',
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
    {
      attribute: 'StudyDescription',
      constraint: {
        contains: 'PETCT',
      },
    },
    {
      attribute: 'StudyDescription',
      constraint: {
        contains: 'PET/CT',
      },
    },
  ],
  displaySetSelectors: {
    ctDisplaySet: {
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
        {
          attribute: 'SeriesDescription',
          constraint: {
            contains: 'CT',
          },
        },
        {
          attribute: 'SeriesDescription',
          constraint: {
            contains: 'CT WB',
          },
        },
      ],
    },
    ptDisplaySet: {
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
      ],
    },
  },

  stages: [stage1, stage2, stage3, stage4],
  numberOfPriorsReferenced: -1,
};

function getHangingProtocolModule() {
  return [
    {
      name: ptCT.id,
      protocol: ptCT,
    },
  ];
}

export default getHangingProtocolModule;
