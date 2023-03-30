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

const ptCT = {
  id: '@ohif/extension-tmtv.hangingProtocolModule.ptCT',
  locked: true,
  hasUpdatedPriorsInformation: false,
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

  stages: [
    {
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
    },
    {
      name: 'stage-2',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 2,
          columns: 2,
        },
      },
      viewports: [ctAXIAL, fusionAXIAL, ptAXIAL, mipSAGITTAL],
    },
    {
      name: '2x3-layout',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 2,
          columns: 3,
        },
      },
      viewports: [
        ctAXIAL,
        ctSAGITTAL,
        ctCORONAL,
        ptAXIAL,
        ptSAGITTAL,
        ptCORONAL,
      ],
    },
    {
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
    },
  ],
  numberOfPriorsReferenced: -1,
};

function getHangingProtocolModule() {
  return [
    {
      id: ptCT.id,
      protocol: ptCT,
    },
  ];
}

export default getHangingProtocolModule;
