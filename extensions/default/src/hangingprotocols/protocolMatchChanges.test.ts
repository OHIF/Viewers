import { HPMatcher } from '@ohif/core/src/services/HangingProtocolService/HPMatcher';
import { RMLO } from './utils/mammoDisplaySetSelector';
import { seriesWithImages } from './utils/seriesSelectors';

const match = (displaySet, rules) => HPMatcher.match(displaySet, rules, {}, {});

describe('hanging protocol matches with a missing text value', () => {
  const rightMlo = { ViewCode: 'SCT:399368009', PatientOrientation: ['A', 'FR'] };

  it('hpMammo RMLO accepts a display set with no SeriesDescription', () => {
    const result = match(rightMlo, RMLO.seriesMatchingRules);
    expect(result.requiredFailed).toBe(false);
  });

  it('hpMammo RMLO still rejects a CC series description', () => {
    const result = match({ ...rightMlo, SeriesDescription: 'R CC' }, RMLO.seriesMatchingRules);
    expect(result.requiredFailed).toBe(true);
  });

  // The ptDisplaySet rules of the tmtv protocol (extensions/tmtv), which has no jest project.
  const ptRules = [
    { attribute: 'Modality', constraint: { equals: 'PT' }, required: true },
    { attribute: 'SeriesDescription', constraint: { contains: 'Corrected' } },
    {
      weight: 2,
      attribute: 'SeriesDescription',
      constraint: { doesNotContain: { value: 'Uncorrected' } },
    },
  ];

  it('tmtv scores a PT with no SeriesDescription above an uncorrected PT', () => {
    const missing = match({ Modality: 'PT' }, ptRules).score;
    const uncorrected = match({ Modality: 'PT', SeriesDescription: 'PET Uncorrected' }, ptRules)
      .score;
    expect(missing).toBeGreaterThan(uncorrected);
  });
});

describe('hanging protocol matches with a numeric string', () => {
  it('seriesWithImages accepts numImageFrames as text, as a number', () => {
    expect(match({ numImageFrames: '30' }, seriesWithImages).requiredFailed).toBe(false);
    expect(match({ numImageFrames: 30 }, seriesWithImages).requiredFailed).toBe(false);
  });
});
