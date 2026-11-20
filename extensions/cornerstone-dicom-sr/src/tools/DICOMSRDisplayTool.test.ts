jest.mock('@cornerstonejs/tools', () => ({
  AnnotationTool: class {},
  annotation: {},
  drawing: {},
  utilities: {},
}));
jest.mock('@cornerstonejs/adapters', () => ({ adaptersSR: { Cornerstone3D: { CodeScheme: {} } } }));
jest.mock('./modules/dicomSRModule', () => ({ getTrackingUniqueIdentifiersForElement: jest.fn() }));

import DICOMSRDisplayTool, { getPreviewTextLines } from './DICOMSRDisplayTool';

describe('DICOMSRDisplayTool text box', () => {
  const tool = new DICOMSRDisplayTool();
  const linesOf = labels => tool._getTextBoxLinesFromLabels(labels);

  it('writes one colon after the shorthand of a bidirectional measurement', () => {
    expect(
      linesOf([
        { label: 'Long Axis', value: '31.00 mm' },
        { label: 'Short Axis', value: '12.00 mm' },
      ])
    ).toEqual(['L: 31.00 mm', 'W: 12.00 mm']);
  });

  it('shows a comment without a trailing colon', () => {
    expect(linesOf([{ label: 'Target A', value: '' }])).toEqual(['Target A']);
  });

  it('shows the finding label before the measurement values', () => {
    expect(getPreviewTextLines('Lesion', linesOf([{ label: 'Length', value: '12 mm' }]))).toEqual([
      'Lesion',
      '12 mm',
    ]);
  });

  it('shows only the measurement values without a label', () => {
    expect(
      getPreviewTextLines(undefined, linesOf([{ label: 'Long Axis', value: '31.00 mm' }]))
    ).toEqual(['L: 31.00 mm']);
  });

  it('does not repeat a label that a measurement line already shows', () => {
    expect(
      getPreviewTextLines('Lung', linesOf([{ label: 'Finding Site', value: 'Lung' }]))
    ).toEqual(['Finding Site: Lung']);
    expect(getPreviewTextLines('Target A', linesOf([{ label: 'Target A', value: '' }]))).toEqual([
      'Target A',
    ]);
  });
});
