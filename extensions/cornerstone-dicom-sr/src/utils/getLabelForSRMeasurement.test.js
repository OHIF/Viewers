jest.mock('@cornerstonejs/adapters', () => ({
  adaptersSR: {
    Cornerstone3D: { CodeScheme: { codeValues: { CORNERSTONEFREETEXT: 'CORNERSTONEFREETEXT' } } },
  },
}));

import getLabelForSRMeasurement from './getLabelForSRMeasurement';
import getLabelFromDCMJSImportedToolData from './getLabelFromDCMJSImportedToolData';

const freeText = meaning => ({ CodeValue: 'CORNERSTONEFREETEXT', CodeMeaning: meaning });
const lesion = { CodeValue: '52988006', CodingSchemeDesignator: 'SCT', CodeMeaning: 'Lesion' };

describe('getLabelFromDCMJSImportedToolData', () => {
  it('prefers the annotation label', () => {
    expect(
      getLabelFromDCMJSImportedToolData({
        annotation: { data: { label: 'Mine' } },
        finding: lesion,
        findingSites: [freeText('Site')],
      })
    ).toBe('Mine');
  });

  it('uses a free-text finding site before the finding', () => {
    expect(
      getLabelFromDCMJSImportedToolData({
        annotation: { data: {} },
        finding: freeText('Text finding'),
        findingSites: [freeText('Site')],
      })
    ).toBe('Site');
  });

  it('uses a free-text finding', () => {
    expect(
      getLabelFromDCMJSImportedToolData({
        annotation: { data: {} },
        finding: freeText('Text finding'),
      })
    ).toBe('Text finding');
  });

  it('falls back to the meaning of a coded finding', () => {
    expect(getLabelFromDCMJSImportedToolData({ annotation: { data: {} }, finding: lesion })).toBe(
      'Lesion'
    );
  });

  it('returns undefined when there is nothing to label with', () => {
    expect(getLabelFromDCMJSImportedToolData({})).toBeUndefined();
  });
});

describe('getLabelForSRMeasurement', () => {
  it('labels a measurement from its coded finding', () => {
    expect(getLabelForSRMeasurement({ srFinding: lesion, srFindingSites: [], labels: [] })).toBe(
      'Lesion'
    );
  });

  it('puts the comment ahead of the coded finding, as hydration does', () => {
    expect(getLabelForSRMeasurement({ srComment: 'Target A', srFinding: lesion, labels: [] })).toBe(
      'Target A'
    );
  });

  it('falls back to the finding site line when no concepts were kept', () => {
    expect(getLabelForSRMeasurement({ labels: [{ label: 'Finding Site', value: 'Lung' }] })).toBe(
      'Lung'
    );
  });

  it('returns undefined without a measurement', () => {
    expect(getLabelForSRMeasurement(undefined)).toBeUndefined();
  });
});
