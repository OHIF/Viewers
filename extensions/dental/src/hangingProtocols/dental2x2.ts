import { Types } from '@ohif/core';

const currentDisplaySetSelector = {
  studyMatchingRules: [
    {
      attribute: 'studyInstanceUIDsIndex',
      from: 'options',
      required: true,
      constraint: {
        equals: { value: 0 },
      },
    },
  ],
  seriesMatchingRules: [
    {
      attribute: 'numImageFrames',
      weight: 1,
      required: true,
      constraint: {
        greaterThan: { value: 0 },
      },
    },
    {
      attribute: 'isDisplaySetFromUrl',
      weight: 20,
      constraint: {
        equals: true,
      },
    },
  ],
};

const priorSameModalityDisplaySetSelector = {
  studyMatchingRules: [
    {
      attribute: 'studyInstanceUIDsIndex',
      from: 'options',
      required: true,
      constraint: {
        greaterThan: { value: 0 },
      },
    },
  ],
  seriesMatchingRules: [
    {
      attribute: 'numImageFrames',
      weight: 1,
      required: true,
      constraint: {
        greaterThan: { value: 0 },
      },
    },
    {
      attribute: 'sameAttributeAsDisplaySet',
      required: true,
      constraint: {
        equals: true,
      },
    },
  ],
};

const stackViewportOptions = {
  viewportType: 'stack',
  toolGroupId: 'default',
  allowUnmatchedView: true,
};

const currentViewport = {
  viewportOptions: {
    ...stackViewportOptions,
    viewportId: 'dental-current',
    customViewportProps: {
      dentalSlot: 'current',
    },
  },
  displaySets: [
    {
      id: 'currentDisplaySetId',
    },
  ],
};

const priorViewport = {
  viewportOptions: {
    ...stackViewportOptions,
    viewportId: 'dental-prior',
    customViewportProps: {
      dentalSlot: 'prior',
    },
  },
  displaySets: [
    {
      id: 'priorSameModalityDisplaySetId',
    },
  ],
};

const bitewingPlaceholderLeft = {
  viewportOptions: {
    ...stackViewportOptions,
    viewportId: 'dental-bitewing-left',
    customViewportProps: {
      dentalSlot: 'bitewing-left',
    },
  },
  displaySets: [],
};

const bitewingPlaceholderRight = {
  viewportOptions: {
    ...stackViewportOptions,
    viewportId: 'dental-bitewing-right',
    customViewportProps: {
      dentalSlot: 'bitewing-right',
    },
  },
  displaySets: [],
};

export const dental2x2Protocol: Types.HangingProtocol.Protocol = {
  id: '@ohif/extension-dental.hangingProtocolModule.dental2x2',
  name: 'Dental 2x2',
  description:
    'Fixed Dental Mode 2x2 layout with current image, same-modality prior, and bitewing placeholders.',
  locked: true,
  numberOfPriorsReferenced: 0,
  toolGroupIds: ['default'],
  protocolMatchingRules: [
    {
      id: 'OneOrMoreSeries',
      weight: 1000,
      attribute: 'numberOfDisplaySetsWithImages',
      constraint: {
        greaterThan: 0,
      },
    },
  ],
  displaySetSelectors: {
    currentDisplaySetId: currentDisplaySetSelector,
    priorSameModalityDisplaySetId: priorSameModalityDisplaySetSelector,
  },
  defaultViewport: {
    viewportOptions: stackViewportOptions,
    displaySets: [
      {
        id: 'currentDisplaySetId',
        matchedDisplaySetsIndex: -1,
      },
    ],
  },
  stages: [
    {
      id: 'dental-2x2',
      name: 'Dental 2x2',
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
        currentViewport,
        priorViewport,
        bitewingPlaceholderLeft,
        bitewingPlaceholderRight,
      ],
    },
  ],
};

export default dental2x2Protocol;
