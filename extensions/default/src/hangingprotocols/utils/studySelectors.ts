import { Types } from '@ohif/core';

type MatchingRule = Types.HangingProtocol.MatchingRule;

export const studyWithImages: MatchingRule[] = [
  {
    id: 'OneOrMoreSeries',
    weight: 25,
    attribute: 'numberOfDisplaySetsWithImages',
    constraint: {
      greaterThan: 0,
    },
  },
];
