// CID 4014 lists legacy SNOMED-RT IDs for these views. Mammography images
// can use either SRT or SNM3 for the legacy codes.
const ccViewCodes = ['SCT:399162004', 'SRT:R-10242', 'SNM3:R-10242'];
const mloViewCodes = ['SCT:399368009', 'SRT:R-10226', 'SNM3:R-10226'];

const priorStudyMatchingRules = [
  {
    // The priorInstance is a study counter that indicates what position this study is in
    // and the value comes from the options parameter.
    attribute: 'studyInstanceUIDsIndex',
    from: 'options',
    required: true,
    constraint: {
      equals: { value: 1 },
    },
  },
];

const currentStudyMatchingRules = [
  {
    // The priorInstance is a study counter that indicates what position this study is in
    // and the value comes from the options parameter.
    attribute: 'studyInstanceUIDsIndex',
    from: 'options',
    required: true,
    constraint: {
      equals: { value: 0 },
    },
  },
];

const LCCSeriesMatchingRules = [
  {
    weight: 10,
    attribute: 'ViewCode',
    constraint: {
      includes: ccViewCodes,
    },
  },
  {
    weight: 5,
    attribute: 'PatientOrientation',
    constraint: {
      contains: 'L',
    },
  },
  {
    weight: 20,
    attribute: 'SeriesDescription',
    constraint: {
      contains: 'L CC',
    },
  },
];

const RCCSeriesMatchingRules = [
  {
    weight: 10,
    attribute: 'ViewCode',
    constraint: {
      includes: ccViewCodes,
    },
  },
  {
    weight: 5,
    attribute: 'PatientOrientation',
    constraint: {
      equals: ['P', 'L'],
    },
  },
  {
    attribute: 'PatientOrientation',
    constraint: {
      doesNotEqual: ['A', 'R'],
    },
    required: true,
  },
  {
    weight: 20,
    attribute: 'SeriesDescription',
    constraint: {
      contains: 'CC',
    },
  },
];

const LMLOSeriesMatchingRules = [
  {
    weight: 10,
    attribute: 'ViewCode',
    constraint: {
      includes: mloViewCodes,
    },
  },
  {
    weight: 0,
    attribute: 'ViewCode',
    constraint: {
      doesNotInclude: ccViewCodes,
    },
    required: true,
  },
  {
    weight: 5,
    attribute: 'PatientOrientation',
    constraint: {
      equals: ['A', 'R'],
    },
  },
  {
    weight: 20,
    attribute: 'SeriesDescription',
    constraint: {
      contains: 'L MLO',
    },
  },
];

const RMLOSeriesMatchingRules = [
  {
    weight: 10,
    attribute: 'ViewCode',
    constraint: {
      includes: mloViewCodes,
    },
  },
  {
    attribute: 'ViewCode',
    constraint: {
      doesNotInclude: ccViewCodes,
    },
    required: true,
  },
  {
    attribute: 'PatientOrientation',
    constraint: {
      doesNotContain: ['P', 'FL'],
    },
    required: true,
  },
  {
    weight: 5,
    attribute: 'PatientOrientation',
    constraint: {
      equals: ['P', 'L'],
    },
  },
  {
    weight: 5,
    attribute: 'PatientOrientation',
    constraint: {
      equals: ['A', 'FR'],
    },
  },
  {
    weight: 20,
    attribute: 'SeriesDescription',
    constraint: {
      contains: 'R MLO',
    },
  },
  {
    attribute: 'SeriesDescription',
    required: true,
    constraint: {
      doesNotContain: 'CC',
    },
  },
  {
    attribute: 'SeriesDescription',
    required: true,
    constraint: {
      doesNotEqual: 'L MLO',
    },
    required: true,
  },
];

const RCC = {
  seriesMatchingRules: RCCSeriesMatchingRules,
  studyMatchingRules: currentStudyMatchingRules,
};

const RCCPrior = {
  seriesMatchingRules: RCCSeriesMatchingRules,
  studyMatchingRules: priorStudyMatchingRules,
};

const LCC = {
  seriesMatchingRules: LCCSeriesMatchingRules,
  studyMatchingRules: currentStudyMatchingRules,
};

const LCCPrior = {
  seriesMatchingRules: LCCSeriesMatchingRules,
  studyMatchingRules: priorStudyMatchingRules,
};

const RMLO = {
  seriesMatchingRules: RMLOSeriesMatchingRules,
  studyMatchingRules: currentStudyMatchingRules,
};

const RMLOPrior = {
  seriesMatchingRules: RMLOSeriesMatchingRules,
  studyMatchingRules: priorStudyMatchingRules,
};

const LMLO = {
  seriesMatchingRules: LMLOSeriesMatchingRules,
  studyMatchingRules: currentStudyMatchingRules,
};

const LMLOPrior = {
  seriesMatchingRules: LMLOSeriesMatchingRules,
  studyMatchingRules: priorStudyMatchingRules,
};

export { RCC, LCC, RMLO, LMLO, RCCPrior, LCCPrior, RMLOPrior, LMLOPrior };
