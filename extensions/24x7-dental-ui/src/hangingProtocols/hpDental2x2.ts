import { Types } from '@ohif/core';

export const DENTAL_HP_2X2_ID = '@24x7-dental-ui/hp2x2';

const currentStudyMatchingRules: Types.HangingProtocol.MatchingRule[] = [
  {
    attribute: 'studyInstanceUIDsIndex',
    from: 'options',
    required: true,
    constraint: { equals: { value: 0 } },
  },
];

const priorStudyMatchingRules: Types.HangingProtocol.MatchingRule[] = [
  {
    attribute: 'studyInstanceUIDsIndex',
    from: 'options',
    required: true,
    constraint: { equals: { value: 1 } },
  },
];

const seriesWithImages: Types.HangingProtocol.MatchingRule[] = [
  {
    attribute: 'numImageFrames',
    weight: 1,
    required: true,
    constraint: { greaterThan: { value: 0 } },
  },
  // Prefer series explicitly referenced in the URL (e.g., deep-link to a study).
  {
    attribute: 'isDisplaySetFromUrl',
    weight: 20,
    constraint: { equals: true },
  },
];

const biteWingIdentificationRule: Types.HangingProtocol.MatchingRule = {
  attribute: 'SeriesDescription',
  weight: 100,
  required: true,
  constraint: {
    containsI: ['bitewing', 'bite wing', 'interproximal', 'bwx', 'bw xray', 'intraoral bw'],
  },
};

const stackViewportOptions: Types.HangingProtocol.ViewportOptions = {
  viewportType: 'stack',
  toolGroupId: 'default',
  allowUnmatchedView: true,
};

const hpDental2x2: Types.HangingProtocol.Protocol = {
  id: DENTAL_HP_2X2_ID,
  name: 'Dental 2×2',
  description:
    'Dental view: current image (top-left), prior exam (top-right), bitewing placeholders (bottom row).',
  numberOfPriorsReferenced: 1,
  protocolMatchingRules: [
    {
      id: 'hasImages',
      weight: 25,
      attribute: 'numberOfDisplaySetsWithImages',
      constraint: { greaterThan: 0 },
    },
  ],
  toolGroupIds: ['default'],
  displaySetSelectors: {
    currentSeriesId: {
      studyMatchingRules: currentStudyMatchingRules,
      seriesMatchingRules: seriesWithImages,
    },
    priorSeriesId: {
      allowUnmatchedView: true,
      studyMatchingRules: priorStudyMatchingRules,
      seriesMatchingRules: [
        {
          attribute: 'numImageFrames',
          weight: 1,
          constraint: { greaterThan: { value: 0 } },
        },
      ],
    },
    biteWingSeriesId: {
      allowUnmatchedView: true,
      studyMatchingRules: currentStudyMatchingRules,
      seriesMatchingRules: [
        ...seriesWithImages.filter(r => r.attribute === 'numImageFrames'),
        biteWingIdentificationRule,
      ],
    },
  },
  defaultViewport: {
    viewportOptions: stackViewportOptions,
    displaySets: [
      {
        id: 'currentSeriesId',
        matchedDisplaySetsIndex: -1,
      },
    ],
  },
  stages: [
    {
      id: 'dental-2x2',
      name: '2×2',
      stageActivation: {
        enabled: {
          minViewportsMatched: 1,
        },
      },
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 2,
          columns: 2,
        },
      },
      viewports: [
        {
          viewportOptions: stackViewportOptions,
          displaySets: [
            {
              id: 'currentSeriesId',
              matchedDisplaySetsIndex: 0,
            },
          ],
        },
        {
          viewportOptions: stackViewportOptions,
          displaySets: [
            {
              id: 'priorSeriesId',
              matchedDisplaySetsIndex: 0,
            },
          ],
        },
        {
          viewportOptions: stackViewportOptions,
          displaySets: [
            {
              id: 'biteWingSeriesId',
              matchedDisplaySetsIndex: 0,
            },
          ],
        },
        {
          viewportOptions: stackViewportOptions,
          displaySets: [
            {
              id: 'biteWingSeriesId',
              matchedDisplaySetsIndex: 1,
            },
          ],
        },
      ],
    },
  ],
};

export default hpDental2x2;
