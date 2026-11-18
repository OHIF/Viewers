import { isImageSeries, seriesIndicatorText } from './seriesIndicatorText';

const image = (uid: string, seriesNumber: number, overrides = {}) => ({
  displaySetInstanceUID: uid,
  StudyInstanceUID: 'study-1',
  SeriesNumber: seriesNumber,
  SeriesDescription: `Series ${seriesNumber}`,
  Modality: 'CT',
  numImageFrames: 10,
  ...overrides,
});

describe('seriesIndicatorText', () => {
  const displaySets = [
    image('a', 1),
    image('sr', 2, { Modality: 'SR', SeriesDescription: 'Report', numImageFrames: 0 }),
    image('b', 3),
    image('c', 4, { SeriesDescription: '' }),
    image('other', 1, { StudyInstanceUID: 'study-2' }),
  ];

  it('gives the position among the image series of the same study and the details', () => {
    expect(seriesIndicatorText(['b'], displaySets)).toBe('2/3 · #3 Series 3');
    expect(seriesIndicatorText(['c'], displaySets)).toBe('3/3 · #4');
  });

  it('counts the other study separately', () => {
    expect(seriesIndicatorText(['other'], displaySets)).toBe('1/1 · #1 Series 1');
  });

  it('shows only number and description for non-image display sets', () => {
    expect(seriesIndicatorText(['sr'], displaySets)).toBe('#2 Report');
  });

  it('counts series whose images are not loaded yet (no imageIds)', () => {
    const notLoaded = [image('a', 1, { numImageFrames: 0, instances: [{}, {}] }), image('b', 2)];
    expect(seriesIndicatorText(['b'], notLoaded)).toBe('2/2 · #2 Series 2');
  });

  it('skips display sets hidden from the thumbnail browser', () => {
    const sets = [image('a', 1, { excludeFromThumbnailBrowser: true }), image('b', 2)];
    expect(seriesIndicatorText(['b'], sets)).toBe('1/1 · #2 Series 2');
  });

  it('is empty when the viewport shows nothing known', () => {
    expect(seriesIndicatorText([], displaySets)).toBe('');
    expect(seriesIndicatorText(['missing'], displaySets)).toBe('');
  });

  it('treats unsupported and image-less display sets as non-image', () => {
    expect(isImageSeries(image('x', 1, { unsupported: true }))).toBe(false);
    expect(isImageSeries(image('x', 1, { numImageFrames: 0 }))).toBe(false);
    expect(isImageSeries(image('x', 1))).toBe(true);
  });
});
