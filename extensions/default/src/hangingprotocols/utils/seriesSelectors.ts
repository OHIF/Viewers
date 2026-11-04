import { Types } from '@ohif/core';

type MatchingRule = Types.HangingProtocol.MatchingRule;

// This display set will select the specified items by preference
// It has no effect if nothing is specified in the URL.
const displaySetFromUrl: MatchingRule = {
  attribute: 'isDisplaySetFromUrl',
  weight: 20,
  constraint: {
    equals: true,
  },
};

// A segmentation that the viewer creates has numImageFrames.
const notSegmentation: MatchingRule = {
  attribute: 'Modality',
  constraint: {
    doesNotInclude: ['SEG'],
  },
  required: true,
};

/** Display sets with at least one image frame. */
export const seriesWithImages: MatchingRule[] = [
  {
    attribute: 'numImageFrames',
    constraint: {
      greaterThanOrEqual: { value: 1 },
    },
    weight: 1,
    required: true,
  },
  notSegmentation,
  displaySetFromUrl,
];

/**
 * Display sets that a viewport can show: the image display sets, and the
 * display sets whose SOP class handler sets numImageFrames to 0, for example
 * an ECG, a whole slide image or a PDF. An SR, PR or SEG from the server has
 * no numImageFrames, so it does not match. Image display sets sort first.
 */
export const seriesViewable: MatchingRule[] = [
  {
    attribute: 'numImageFrames',
    constraint: {
      greaterThanOrEqual: { value: 0 },
    },
    weight: 1,
    required: true,
  },
  {
    attribute: 'numImageFrames',
    constraint: {
      greaterThanOrEqual: { value: 1 },
    },
    weight: 10,
  },
  notSegmentation,
  displaySetFromUrl,
];
