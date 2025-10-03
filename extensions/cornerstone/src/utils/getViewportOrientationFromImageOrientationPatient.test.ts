import { getViewportOrientationFromImageOrientationPatient } from './getViewportOrientationFromImageOrientationPatient';

describe('getViewportOrientationFromImageOrientationPatient', () => {
  it('should return undefined when imageOrientationPatient is null', () => {
    const result = getViewportOrientationFromImageOrientationPatient(null);
    expect(result).toBeUndefined();
  });

  it('should return undefined when imageOrientationPatient is undefined', () => {
    const result = getViewportOrientationFromImageOrientationPatient(undefined);
    expect(result).toBeUndefined();
  });

  it('should return undefined when imageOrientationPatient has length less than 6', () => {
    const result = getViewportOrientationFromImageOrientationPatient([1, 0, 0, 0, 1]);
    expect(result).toBeUndefined();
  });

  it('should return undefined when imageOrientationPatient has length greater than 6', () => {
    const result = getViewportOrientationFromImageOrientationPatient([1, 0, 0, 0, 1, 0, 0]);
    expect(result).toBeUndefined();
  });

  it('should return undefined when imageOrientationPatient is empty array', () => {
    const result = getViewportOrientationFromImageOrientationPatient([]);
    expect(result).toBeUndefined();
  });

  it('should return "axial" when imageOrientationPatient matches axial orientation', () => {
    const result = getViewportOrientationFromImageOrientationPatient([1, 0, 0, 0, 1, 0]);
    expect(result).toBe('axial');
  });

  it('should return "sagittal" when imageOrientationPatient matches sagittal orientation', () => {
    const result = getViewportOrientationFromImageOrientationPatient([0, 1, 0, 0, 0, -1]);
    expect(result).toBe('sagittal');
  });

  it('should return "coronal" when imageOrientationPatient matches coronal orientation', () => {
    const result = getViewportOrientationFromImageOrientationPatient([1, 0, 0, 0, 0, -1]);
    expect(result).toBe('coronal');
  });

  it('should return undefined when no orientation matches', () => {
    const result = getViewportOrientationFromImageOrientationPatient([
      0.5, 0.5, 0.7, 0.3, 0.8, 0.5,
    ]);
    expect(result).toBeUndefined();
  });
});
