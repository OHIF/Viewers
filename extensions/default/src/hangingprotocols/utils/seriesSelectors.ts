import { Types } from '@ohif/core';

type MatchingRule = Types.HangingProtocol.MatchingRule;

export const seriesWithImages: MatchingRule[] = [
  // Prefer viewable display sets: images, ECG waveforms or whole slide images.
  // greaterThan tests >=, so value 1 means at least one frame.
  {
    attribute: 'numImageFrames',
    constraint: {
      greaterThan: { value: 1 },
    },
    weight: 1,
  },
  {
    attribute: 'Modality',
    constraint: {
      equals: 'ECG',
    },
    weight: 1,
  },
  {
    attribute: 'Modality',
    constraint: {
      equals: 'SM',
    },
    weight: 1,
  },
  // This display set will select the specified items by preference
  // It has no affect if nothing is specified in the URL.
  {
    attribute: 'isDisplaySetFromUrl',
    weight: 20,
    constraint: {
      equals: true,
    },
  },
];
