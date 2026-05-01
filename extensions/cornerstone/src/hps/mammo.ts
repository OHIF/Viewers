export const mgCC = {
  id: 'mgCC',
  name: 'mammo-cc',
  imageLoadStrategy: 'interleaveTopToBottom',
  protocolMatchingRules: [
    { attribute: 'ModalitiesInStudy', constraint: { contains: ['MG', 'DX'] } },
  ],
  displaySetSelectors: {
    isRCC: {
      seriesMatchingRules: [
        { weight: 1, attribute: 'isRCC', constraint: { equals: { value: true } } },
      ],
    },
    isLCC: {
      seriesMatchingRules: [
        { weight: 1, attribute: 'isLCC', constraint: { equals: { value: true } } },
      ],
    },
  },
  stages: [
    {
      name: 'default',
      viewportStructure: { layoutType: 'grid', properties: { rows: 1, columns: 2 } },
      viewports: [{ displaySets: [{ id: 'isRCC' }] }, { displaySets: [{ id: 'isLCC' }] }],
    },
  ],
  numberOfPriorsReferenced: -1,
};

export const mgMLO = {
  id: 'mgMLO',
  name: 'mammo-mlo',
  imageLoadStrategy: 'interleaveTopToBottom',
  protocolMatchingRules: [
    { attribute: 'ModalitiesInStudy', constraint: { contains: ['MG', 'DX'] } },
  ],
  displaySetSelectors: {
    isRMLO: {
      seriesMatchingRules: [
        { weight: 1, attribute: 'isRMLO', constraint: { equals: { value: true } } },
      ],
    },
    isLMLO: {
      seriesMatchingRules: [
        { weight: 1, attribute: 'isLMLO', constraint: { equals: { value: true } } },
      ],
    },
  },
  stages: [
    {
      name: 'default',
      viewportStructure: { layoutType: 'grid', properties: { rows: 1, columns: 2 } },
      viewports: [{ displaySets: [{ id: 'isRMLO' }] }, { displaySets: [{ id: 'isLMLO' }] }],
    },
  ],
  numberOfPriorsReferenced: -1,
};
