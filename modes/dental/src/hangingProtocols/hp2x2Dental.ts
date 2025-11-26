import { Types } from '@ohif/core';

/**
 * Display set selector for current study images
 * Matches the first study (index 0) with dental modalities
 */
const currentDisplaySetSelector: Types.HangingProtocol.DisplaySetSelector = {
  studyMatchingRules: [
    {
      attribute: 'studyInstanceUIDsIndex',
      from: 'options', // Note: 'from' is used in HPMatcher but not in TS types
      required: true,
      constraint: {
        equals: { value: 0 },
      },
    } as Types.HangingProtocol.MatchingRule,
  ],
  seriesMatchingRules: [
    {
      attribute: 'numImageFrames',
      constraint: {
        greaterThan: { value: 0 },
      },
      required: true,
    },
    {
      attribute: 'Modality',
      constraint: {
        equals: {
          value: 'DX',
        },
      },
      weight: 5,
    },
    {
      attribute: 'Modality',
      constraint: {
        equals: {
          value: 'PX',
        },
      },
      weight: 5,
    },
    {
      attribute: 'Modality',
      constraint: {
        equals: {
          value: 'IO',
        },
      },
      weight: 5,
    },
    // Prefer URL-specified display sets
    {
      attribute: 'isDisplaySetFromUrl',
      weight: 20,
      constraint: {
        equals: true,
      },
    },
  ],
};

/**
 * Display set selector for prior study images
 * Matches the second study (index 1) with the same modality as current
 */
const priorDisplaySetSelector: Types.HangingProtocol.DisplaySetSelector = {
  studyMatchingRules: [
    {
      attribute: 'studyInstanceUIDsIndex',
      from: 'options', // Note: 'from' is used in HPMatcher but not in TS types
      required: true,
      constraint: {
        equals: { value: 1 },
      },
    } as Types.HangingProtocol.MatchingRule,
  ],
  seriesMatchingRules: [
    {
      attribute: 'numImageFrames',
      constraint: {
        greaterThan: { value: 0 },
      },
      required: true,
    },
    {
      attribute: 'Modality',
      constraint: {
        equals: {
          value: 'DX',
        },
      },
      weight: 5,
    },
    {
      attribute: 'Modality',
      constraint: {
        equals: {
          value: 'PX',
        },
      },
      weight: 5,
    },
    {
      attribute: 'Modality',
      constraint: {
        equals: {
          value: 'IO',
        },
      },
      weight: 5,
    },
  ],
};

/**
 * Display set selector for bitewing images in current study
 * Matches series with "bitewing" in the description
 */
const bitewingDisplaySetSelector: Types.HangingProtocol.DisplaySetSelector = {
  studyMatchingRules: [
    {
      attribute: 'studyInstanceUIDsIndex',
      from: 'options', // Note: 'from' is used in HPMatcher but not in TS types
      required: true,
      constraint: {
        equals: { value: 0 },
      },
    } as Types.HangingProtocol.MatchingRule,
  ],
  seriesMatchingRules: [
    {
      attribute: 'numImageFrames',
      constraint: {
        greaterThan: { value: 0 },
      },
      required: true,
    },
    {
      attribute: 'SeriesDescription',
      constraint: {
        contains: {
          value: 'bitewing',
        },
      },
      weight: 10,
      required: false,
    },
    {
      attribute: 'SeriesDescription',
      constraint: {
        contains: {
          value: 'BW',
        },
      },
      weight: 10,
      required: false,
    },
    {
      attribute: 'Modality',
      constraint: {
        equals: {
          value: 'IO',
        },
      },
      weight: 3,
    },
  ],
};

/**
 * Viewport configuration for top-left: Current image
 */
const topLeftViewport: Types.HangingProtocol.Viewport = {
  viewportOptions: {
    viewportId: 'dental-current-primary',
    viewportType: 'stack',
    toolGroupId: 'dental-current',
    allowUnmatchedView: true,
  },
  displaySets: [
    {
      id: 'currentDisplaySetId',
      matchedDisplaySetsIndex: 0,
    },
  ],
};

/**
 * Viewport configuration for top-right: Duplicate of current image
 */
const topRightViewport: Types.HangingProtocol.Viewport = {
  viewportOptions: {
    viewportId: 'dental-current-duplicate',
    viewportType: 'stack',
    toolGroupId: 'dental-prior',
    allowUnmatchedView: true,
  },
  displaySets: [
    {
      id: 'currentDisplaySetId',
      matchedDisplaySetsIndex: 0,
    },
  ],
};

/**
 * Viewport configuration for bottom-left: Bitewing placeholder
 */
const bottomLeftViewport: Types.HangingProtocol.Viewport = {
  viewportOptions: {
    viewportId: 'dental-bitewing-left',
    viewportType: 'stack',
    toolGroupId: 'dental-bitewing-left',
    allowUnmatchedView: true,
  },
  displaySets: [
    {
      id: 'bitewingDisplaySetId',
      matchedDisplaySetsIndex: 0,
    },
  ],
};

/**
 * Viewport configuration for bottom-right: Bitewing placeholder
 */
const bottomRightViewport: Types.HangingProtocol.Viewport = {
  viewportOptions: {
    viewportId: 'dental-bitewing-right',
    viewportType: 'stack',
    toolGroupId: 'dental-bitewing-right',
    allowUnmatchedView: true,
  },
  displaySets: [
    {
      id: 'bitewingDisplaySetId',
      matchedDisplaySetsIndex: 1,
    },
  ],
};

/**
 * Dental 2x2 Hanging Protocol
 *
 * Layout:
 * +------------------+------------------+
 * | Top-Left:        | Top-Right:       |
 * | Current Image    | Prior Exam       |
 * | (Same Modality)  | (Same Modality)  |
 * +------------------+------------------+
 * | Bottom-Left:     | Bottom-Right:    |
 * | Bitewing 1       | Bitewing 2       |
 * | (Placeholder)    | (Placeholder)    |
 * +------------------+------------------+
 *
 * This protocol is designed for dental comparison workflows where:
 * - Top row compares current and prior exams side-by-side
 * - Bottom row displays bitewing images for detailed analysis
 *
 * The protocol can work with or without prior studies:
 * - With priors: Full 2x2 comparison layout
 * - Without priors: Falls back to showing current study only
 */
const hp2x2Dental: Types.HangingProtocol.Protocol = {
  id: '@ohif/dental-2x2',
  description: '2x2 layout for dental comparison: current vs prior (top), bitewings (bottom)',
  name: 'Dental 2x2 Comparison',

  /**
   * numberOfPriorsReferenced: 0 means this protocol can work with 0 or more priors
   * The protocol will activate even without a prior study, but works best with one
   */
  numberOfPriorsReferenced: 0,

  /**
   * Protocol matching rules - will activate when a prior study is available
   * If no prior is available, the protocol can still be manually activated
   */
  protocolMatchingRules: [
    {
      id: 'Dental Study',
      weight: 100,
      attribute: 'Modality',
      constraint: {
        contains: {
          value: 'DX',
        },
      },
    },
    {
      id: 'Dental Study PX',
      weight: 100,
      attribute: 'Modality',
      constraint: {
        contains: {
          value: 'PX',
        },
      },
    },
    {
      id: 'Dental Study IO',
      weight: 100,
      attribute: 'Modality',
      constraint: {
        contains: {
          value: 'IO',
        },
      },
    },
  ],

  toolGroupIds: ['dental-current', 'dental-prior', 'dental-bitewing-left', 'dental-bitewing-right'],

  /**
   * Display set selectors define how images are matched for each viewport
   */
  displaySetSelectors: {
    currentDisplaySetId: currentDisplaySetSelector,
    priorDisplaySetId: priorDisplaySetSelector,
    bitewingDisplaySetId: bitewingDisplaySetSelector,
  },

  /**
   * Default viewport settings for any additional viewports
   * Updated to match upper right viewport (prior exam)
   */
  defaultViewport: {
    viewportOptions: {
      viewportType: 'stack',
      toolGroupId: 'dental-current',
      allowUnmatchedView: true,
    },
    displaySets: [
      {
        id: 'priorDisplaySetId',
        matchedDisplaySetsIndex: 0,
      },
    ],
  },

  /**
   * Stages define different layout configurations
   * Stage 0: Full 2x2 layout with current, prior, and bitewings
   */
  stages: [
    {
      id: 'dental-2x2-full',
      name: 'Dental 2x2 Full',
      stageActivation: {
        enabled: {
          // Activate when we have at least one viewport matched
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
        topLeftViewport, // Top-left: Current image
        topRightViewport, // Top-right: Prior exam
        bottomLeftViewport, // Bottom-left: Bitewing 1
        bottomRightViewport, // Bottom-right: Bitewing 2
      ],
    },
  ],
};

export default hp2x2Dental;
