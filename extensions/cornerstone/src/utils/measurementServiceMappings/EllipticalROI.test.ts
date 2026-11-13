import EllipticalROI from './EllipticalROI';

jest.mock('./utils/getIsLocked', () => ({ getIsLocked: () => false }));
jest.mock('./utils/getIsVisible', () => ({ getIsVisible: () => true }));
jest.mock('./utils/getSOPInstanceAttributes', () => () => ({
  SOPInstanceUID: 'sop-1',
  SeriesInstanceUID: 'series-1',
  StudyInstanceUID: 'study-1',
  frameNumber: 1,
}));

describe('EllipticalROI.toMeasurement', () => {
  const displaySet = {
    displaySetInstanceUID: 'ds-1',
    SeriesNumber: 3,
    instances: [{ SOPInstanceUID: 'sop-1', InstanceNumber: 7 }],
  };
  const displaySetService = {
    getDisplaySetForSOPInstanceUID: () => displaySet,
    getDisplaySetsForSeries: () => [displaySet],
  };

  const toMeasurement = cachedStats =>
    EllipticalROI.toMeasurement(
      {
        annotation: {
          annotationUID: 'uid-1',
          metadata: { toolName: 'EllipticalROI', referencedImageId: 'image-1' },
          data: { handles: { points: [], textBox: {} }, cachedStats },
        },
      },
      displaySetService,
      {},
      () => 'value',
      {}
    );

  it('shows area and max when stats are available', () => {
    const { displayText } = toMeasurement({
      'imageId:image-1': { area: 3084, areaUnit: 'mm²', max: 133, modalityUnit: 'HU' },
    });

    expect(displayText.primary).toEqual(['3084 mm²', 'Max: 133 HU']);
    expect(displayText.secondary).toEqual(['S: 3 I: 7']);
  });

  it('does not show NaN when the ellipse extends outside the image', () => {
    // cornerstone only stores the Modality when the ellipse leaves the image
    const { displayText } = toMeasurement({ 'imageId:image-1': { Modality: 'CT' } });

    expect(displayText.primary).toEqual([]);
    expect(displayText.secondary).toEqual(['S: 3 I: 7']);
  });
});
