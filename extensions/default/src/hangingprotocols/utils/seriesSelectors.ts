import { Types } from '@ohif/core';

type MatchingRule = Types.HangingProtocol.MatchingRule;

// This display set will select the specified items by preference
// It has no affect if nothing is specified in the URL.
const displaySetFromUrl: MatchingRule = {
  attribute: 'isDisplaySetFromUrl',
  weight: 20,
  constraint: {
    equals: true,
  },
};

export const seriesWithImages: MatchingRule[] = [
  // greaterThan tests >=, so value 1 means at least one image frame.
  {
    attribute: 'numImageFrames',
    constraint: {
      greaterThan: { value: 1 },
    },
    weight: 1,
    required: true,
  },
  // A segmentation that the viewer creates has numImageFrames.
  {
    attribute: 'Modality',
    constraint: {
      doesNotInclude: ['SEG'],
    },
    required: true,
  },
  displaySetFromUrl,
];

/**
 * Display sets that a grid protocol shows alone in a 1x1 layout when the
 * study has no image display set. Their SOP class handlers set
 * numImageFrames to 0, so seriesWithImages does not match them.
 */
export const seriesShownAlone: MatchingRule[] = [
  {
    attribute: 'Modality',
    constraint: {
      includes: ['ECG', 'SM'],
    },
    required: true,
  },
  displaySetFromUrl,
];
