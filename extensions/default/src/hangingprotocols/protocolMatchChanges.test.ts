import { HPMatcher } from '@ohif/core/src/services/HangingProtocolService/HPMatcher';
import { LCC, RCC, LMLO, RMLO } from './utils/mammoDisplaySetSelector';
import { seriesViewable, seriesWithImages } from './utils/seriesSelectors';
import { studyWithImages } from './utils/studySelectors';
import viewCode from './utils/viewCode';

const match = (displaySet, rules) => HPMatcher.match(displaySet, rules, {}, {});

describe('mammography view code matching', () => {
  const codedView = (CodingSchemeDesignator, CodeValue) => ({
    instance: { ViewCodeSequence: [{ CodingSchemeDesignator, CodeValue }] },
  });
  const matchView = (displaySet, selector) =>
    HPMatcher.match(
      displaySet,
      selector.seriesMatchingRules,
      { ViewCode: { callback: viewCode } },
      {}
    );

  it.each(['SRT', 'SNM3'])('scores %s view codes the same as their SCT equivalents', scheme => {
    const cc = codedView(scheme, 'R-10242');
    const mlo = codedView(scheme, 'R-10226');
    for (const selector of [RCC, LCC]) {
      expect(matchView(cc, selector).score).toBe(
        matchView(codedView('SCT', '399162004'), selector).score
      );
      expect(matchView(cc, selector).score).toBeGreaterThan(matchView(mlo, selector).score);
    }
    for (const selector of [RMLO, LMLO]) {
      expect(matchView(mlo, selector).score).toBe(
        matchView(codedView('SCT', '399368009'), selector).score
      );
      expect(matchView(cc, selector).requiredFailed).toBe(true);
    }
  });

  it('does not interpret another coding scheme or a partial code as CC', () => {
    expect(matchView(codedView('LOCAL', 'R-10242'), LCC).score).toBe(0);
    expect(matchView(codedView('SCT', '3991620040'), LCC).score).toBe(0);
  });
});

// A stack display set has SeriesDescription '' when the instance has none, and no
// PatientOrientation, so the rules read PatientOrientation from the first instance.
describe('hanging protocol matches with a missing text value', () => {
  const rightMlo = (patientOrientation?) => ({
    ViewCode: 'SCT:399368009',
    SeriesDescription: '',
    instances: [{ PatientOrientation: patientOrientation }],
  });

  it('hpMammo RMLO accepts a display set with an empty SeriesDescription', () => {
    expect(match(rightMlo(['A', 'FR']), RMLO.seriesMatchingRules).requiredFailed).toBe(false);
  });

  it('hpMammo RMLO accepts an instance with no PatientOrientation', () => {
    expect(match(rightMlo(), RMLO.seriesMatchingRules).requiredFailed).toBe(false);
    expect(match(rightMlo(null), RMLO.seriesMatchingRules).requiredFailed).toBe(false);
  });

  it('hpMammo RMLO still rejects a CC series description', () => {
    const result = match(
      { ...rightMlo(['A', 'FR']), SeriesDescription: 'R CC' },
      RMLO.seriesMatchingRules
    );
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
  const ptScore = seriesDescription =>
    match({ Modality: 'PT', SeriesDescription: seriesDescription }, ptRules).score;

  it('the copied tmtv PT rule scores a PT with no description as one with no correction named', () => {
    expect(ptScore('')).toBe(ptScore('PET WB'));
    expect(ptScore(undefined)).toBe(ptScore('PET WB'));
    expect(ptScore('PET WB')).toBeGreaterThan(ptScore('PET Uncorrected'));
    expect(ptScore('PET Attenuation Corrected')).toBeGreaterThan(ptScore('PET WB'));
  });
});

describe('hanging protocol matches with a numeric string', () => {
  it('seriesWithImages accepts numImageFrames as text, as a number', () => {
    expect(match({ numImageFrames: '30' }, seriesWithImages).requiredFailed).toBe(false);
    expect(match({ numImageFrames: 30 }, seriesWithImages).requiredFailed).toBe(false);
  });
});

describe('hanging protocol matches with 0 image frames or 0 display sets', () => {
  it('seriesViewable, not seriesWithImages, accepts a whole slide display set with 0 image frames', () => {
    expect(match({ numImageFrames: 0 }, seriesViewable).requiredFailed).toBe(false);
    expect(match({ numImageFrames: 0 }, seriesWithImages).requiredFailed).toBe(true);
  });

  it('studyWithImages gives no OneOrMoreSeries weight to a study with 0 display sets with images', () => {
    const none = match({ numberOfDisplaySetsWithImages: 0 }, studyWithImages).score;
    const one = match({ numberOfDisplaySetsWithImages: 1 }, studyWithImages).score;
    expect(none).toBeLessThan(one);
  });
});
