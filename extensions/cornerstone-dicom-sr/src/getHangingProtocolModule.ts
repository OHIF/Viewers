import { Types } from '@ohif/core';

const srProtocol: Types.HangingProtocol.Protocol = {
  id: '@ohif/sr',
  // Don't store this hanging protocol as it applies to the currently active
  // display set by default
  // cacheId: null,
  name: 'SR Key Images',
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
        id: 'srDisplaySetId',
        matchedDisplaySetsIndex: -1,
      },
    ],
  },
  displaySetSelectors: {
    srDisplaySetId: {
      seriesMatchingRules: [
        {
          attribute: 'Modality',
          constraint: {
            equals: 'SR',
          },
        },
      ],
    },
  },
  stages: [
    {
      name: 'SR Key Images',
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
              id: 'srDisplaySetId',
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
      name: srProtocol.id,
      protocol: srProtocol,
    },
  ];
}

export default getHangingProtocolModule;
export { srProtocol };
