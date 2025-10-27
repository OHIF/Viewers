import { Types } from '@ohif/core';

// Display set selectors for dental imaging
const currentDisplaySetSelector = {
  id: 'currentDisplaySetId',
  studyMatchingRules: [
    {
      weight: 10,
      attribute: 'isDisplaySetFromUrl',
      constraint: {
        equals: true,
      },
    },
    {
      weight: 5,
      attribute: 'numImageFrames',
      constraint: {
        greaterThan: { value: 0 },
      },
    },
  ],
  seriesMatchingRules: [
    {
      weight: 10,
      attribute: 'Modality',
      constraint: {
        equals: { value: 'DX' }, // Digital X-ray
      },
    },
    {
      weight: 8,
      attribute: 'Modality',
      constraint: {
        equals: { value: 'CR' }, // Computed Radiography
      },
    },
    {
      weight: 6,
      attribute: 'Modality',
      constraint: {
        equals: { value: 'CT' }, // CT for 3D dental imaging
      },
    },
  ],
};

const priorDisplaySetSelector = {
  id: 'priorDisplaySetId',
  studyMatchingRules: [
    {
      weight: 10,
      attribute: 'StudyInstanceUID',
      from: 'prior',
      required: true,
    },
  ],
  seriesMatchingRules: [
    {
      weight: 10,
      attribute: 'Modality',
      constraint: {
        equals: { value: 'DX' },
      },
    },
    {
      weight: 8,
      attribute: 'Modality',
      constraint: {
        equals: { value: 'CR' },
      },
    },
    {
      weight: 6,
      attribute: 'Modality',
      constraint: {
        equals: { value: 'CT' },
      },
    },
  ],
};

// Bitewing display set selector
const bitewingDisplaySetSelector = {
  id: 'bitewingDisplaySetId',
  studyMatchingRules: [
    {
      weight: 10,
      attribute: 'isDisplaySetFromUrl',
      constraint: {
        equals: true,
      },
    },
  ],
  seriesMatchingRules: [
    {
      weight: 10,
      attribute: 'SeriesDescription',
      constraint: {
        contains: { value: 'bitewing' },
      },
    },
    {
      weight: 8,
      attribute: 'SeriesDescription',
      constraint: {
        contains: { value: 'Bitewing' },
      },
    },
    {
      weight: 6,
      attribute: 'SeriesDescription',
      constraint: {
        contains: { value: 'BW' },
      },
    },
  ],
};

// Viewport configurations
const currentViewport = {
  viewportOptions: {
    viewportType: 'stack',
    toolGroupId: 'default',
    allowUnmatchedView: true,
    initialImageOptions: {
      custom: 'sopInstanceLocation',
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
    viewportType: 'stack',
    toolGroupId: 'default',
    allowUnmatchedView: true,
    initialImageOptions: {
      custom: 'sopInstanceLocation',
    },
  },
  displaySets: [
    {
      id: 'priorDisplaySetId',
    },
  ],
};

const bitewingViewport = {
  viewportOptions: {
    viewportType: 'stack',
    toolGroupId: 'default',
    allowUnmatchedView: true,
    initialImageOptions: {
      custom: 'sopInstanceLocation',
    },
  },
  displaySets: [
    {
      id: 'bitewingDisplaySetId',
    },
  ],
};

// Dental 2x2 Hanging Protocol
const dental2x2Protocol: Types.HangingProtocol.Protocol = {
  id: 'dental-2x2',
  name: 'Dental 2x2 Layout',
  description: 'Dental imaging layout with current image, prior exam, and bitewing placeholders',
  locked: true,
  createdDate: '2024-01-01T00:00:00.000Z',
  modifiedDate: '2024-01-01T00:00:00.000Z',
  availableTo: {},
  editableBy: {},
  toolGroupIds: ['default'],
  numberOfPriorsReferenced: 1,
  protocolMatchingRules: [
    {
      id: 'Dental Modality',
      weight: 1000,
      attribute: 'Modality',
      constraint: {
        equals: { value: 'DX' },
      },
    },
    {
      id: 'Dental Study Description',
      weight: 500,
      attribute: 'StudyDescription',
      constraint: {
        contains: { value: 'dental' },
      },
    },
    {
      id: 'Dental Series Description',
      weight: 300,
      attribute: 'SeriesDescription',
      constraint: {
        contains: { value: 'dental' },
      },
    },
  ],
  displaySetSelectors: {
    currentDisplaySetId: currentDisplaySetSelector,
    priorDisplaySetId: priorDisplaySetSelector,
    bitewingDisplaySetId: bitewingDisplaySetSelector,
  },
  defaultViewport: {
    viewportOptions: {
      viewportType: 'stack',
      toolGroupId: 'default',
      allowUnmatchedView: true,
    },
    displaySets: [
      {
        id: 'currentDisplaySetId',
        matchedDisplaySetsIndex: -1,
      },
    ],
  },
  stages: [
    {
      name: 'Dental 2x2',
      id: 'dental-2x2-stage',
      stageActivation: {
        enabled: {
          minViewportsMatched: 2,
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
        // Top-left: Current image
        {
          ...currentViewport,
          viewportOptions: {
            ...currentViewport.viewportOptions,
            viewportId: 'current',
          },
        },
        // Top-right: Prior exam (same modality)
        {
          ...priorViewport,
          viewportOptions: {
            ...priorViewport.viewportOptions,
            viewportId: 'prior',
          },
        },
        // Bottom-left: Bitewing placeholder
        {
          ...bitewingViewport,
          viewportOptions: {
            ...bitewingViewport.viewportOptions,
            viewportId: 'bitewing-left',
          },
        },
        // Bottom-right: Bitewing placeholder
        {
          ...bitewingViewport,
          viewportOptions: {
            ...bitewingViewport.viewportOptions,
            viewportId: 'bitewing-right',
          },
        },
      ],
      createdDate: '2024-01-01T00:00:00.000Z',
    },
  ],
};

export default dental2x2Protocol;
