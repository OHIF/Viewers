import { Types } from '@ohif/core';

const segProtocol: Types.HangingProtocol.Protocol = {
  id: '@ohif/seg',
  // Don't store this hanging protocol as it applies to the currently active
  // display set by default
  // cacheId: null,
  name: 'Segmentations',
  // Just apply this one when specifically listed
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
      viewportType: 'stack',
      toolGroupId: 'default',
      allowUnmatchedView: true,
    },
    displaySets: [
      {
        id: 'segDisplaySetId',
        matchedDisplaySetsIndex: -1,
      },
    ],
  },
  displaySetSelectors: {
    segDisplaySetId: {
      seriesMatchingRules: [
        {
          attribute: 'Modality',
          constraint: {
            equals: 'SEG',
          },
        },
      ],
    },
  },
  stages: [
    {
      name: 'Segmentations',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 1,
          columns: 1,
        },
      },
      viewports: [
        {
          viewportOptions: { allowUnmatchedView: true },
          displaySets: [
            {
              id: 'segDisplaySetId',
            },
          ],
        },
      ],
    },
  ],
};

function getHangingProtocolModule() {
  return [
    {
      name: segProtocol.id,
      protocol: segProtocol,
    },
  ];
}

export default getHangingProtocolModule;
export { segProtocol };
