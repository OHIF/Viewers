const mockAddAnnotation = jest.fn();
const mockSetAnnotationLocked = jest.fn();

jest.mock('@cornerstonejs/tools', () => ({
  annotation: {
    state: { addAnnotation: (...args: unknown[]) => mockAddAnnotation(...args) },
    locking: { setAnnotationLocked: (...args: unknown[]) => mockSetAnnotationLocked(...args) },
  },
}));

jest.mock('@cornerstonejs/core', () => ({ metaData: { get: () => undefined } }));

jest.mock('@cornerstonejs/adapters', () => ({
  adaptersSR: {
    Cornerstone3D: {
      MeasurementReport: {},
      CodeScheme: { codeValues: { CORNERSTONEFREETEXT: 'CORNERSTONEFREETEXT' } },
    },
  },
}));

jest.mock('./getRenderableData', () => ({ __esModule: true, default: () => [[1, 2, 3]] }));

import addSRAnnotation from './addSRAnnotation';

const measurementWith = (extra: Record<string, unknown>) => ({
  TrackingUniqueIdentifier: '1.2.3',
  coords: [{ ValueType: 'SCOORD', GraphicType: 'POINT', GraphicData: [10, 20] }],
  labels: [{ label: 'Finding Site', value: 'Lung' }],
  ...extra,
});

describe('addSRAnnotation', () => {
  beforeEach(() => {
    mockAddAnnotation.mockReset();
    mockSetAnnotationLocked.mockReset();
  });

  it('labels the preview with the coded finding', () => {
    addSRAnnotation({
      measurement: measurementWith({ srFinding: { CodeValue: '52988006', CodeMeaning: 'Lesion' } }),
      imageId: 'image-1',
      displaySet: { displaySetInstanceUID: 'sr' },
    });

    expect(mockAddAnnotation.mock.calls[0][0].data.label).toBe('Lesion');
  });

  it('does not copy a measurement value into the label', () => {
    addSRAnnotation({
      measurement: measurementWith({ labels: [{ label: 'Length', value: '12 mm' }] }),
      imageId: 'image-1',
      displaySet: { displaySetInstanceUID: 'sr' },
    });

    expect(mockAddAnnotation.mock.calls[0][0].data.label).toBeUndefined();
  });

  it('adds the preview locked', () => {
    addSRAnnotation({
      measurement: measurementWith({}),
      imageId: 'image-1',
      displaySet: { displaySetInstanceUID: 'sr' },
    });

    expect(mockSetAnnotationLocked).toHaveBeenCalledWith('1.2.3', true);
  });
});
