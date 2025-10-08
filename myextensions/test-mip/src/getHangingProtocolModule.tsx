import { mipAXIAL, mipSAGITTAL_CT, mipCORONAL_CT } from './utils/hpViewports';

const stageMip1: AppTypes.HangingProtocol.ProtocolStage = {
  id: 'ct-mip-stage-1',
  name: 'CT MIP - 1x2 layout',
  viewportStructure: {
    layoutType: 'grid',
    properties: {
      rows: 1,
      columns: 2,
      layoutOptions: [
        { x: 0, y: 0, width: 0.6, height: 1 }, // main volume viewport (composite)
        { x: 0.6, y: 0, width: 0.4, height: 1 }, // MIP viewport
      ],
    },
  },
  // left: normal CT axial; right: MIP sagittal (for example)
  viewports: [
    {
      // Use one of your normal CT viewports (axial composite)
      viewportOptions: {
        viewportId: 'ctMainAXIAL',
        viewportType: 'stack',
        orientation: 'axial',
        toolGroupId: 'ctToolGroup',
        allowUnmatchedView: true,
      },
      displaySets: [{ id: 'ctDisplaySet', matchedDisplaySetsIndex: -1 }],
    },
    mipSAGITTAL_CT, // this will show MIP for the CT display set
  ],
};

export const ctMipProtocol: AppTypes.HangingProtocol.Protocol = {
  id: 'test-mip.hangingProtocolModule.ctMipProtocol',
  name: 'CT MIP Protocol',
  locked: true,
  imageLoadStrategy: 'default',
  protocolMatchingRules: [
    {
      attribute: 'ModalitiesInStudy',
      constraint: {
        contains: ['CT'],
      },
      required: true,
    },
  ],
  // This defines how we find CT series in the study
  displaySetSelectors: {
    ctDisplaySet: {
      seriesMatchingRules: [
        {
          attribute: 'Modality',
          constraint: { equals: 'CT' },
          required: true,
        },
        {
          weight: 10,
          attribute: 'numImageFrames',
          constraint: { greaterThan: { value: 0 } },
        },
        {
          weight: 5,
          attribute: 'isReconstructable',
          constraint: { equals: { value: true } },
        },
      ],
    },
  },
  stages: [stageMip1],
  numberOfPriorsReferenced: 0,
};

function getHangingProtocolModule() {
  return [
    {
      name: ctMipProtocol.id,
      protocol: ctMipProtocol,
    },
    // you can still return your other protocols if you want:
    // { name: ptCT.id, protocol: ptCT }
  ];
}

export default getHangingProtocolModule;
