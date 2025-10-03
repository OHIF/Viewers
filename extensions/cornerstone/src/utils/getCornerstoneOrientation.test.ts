import { Enums } from '@cornerstonejs/core';
import getCornerstoneOrientation from './getCornerstoneOrientation';

jest.mock('@cornerstonejs/core', () => ({
  Enums: {
    OrientationAxis: {
      AXIAL: 'axial',
      SAGITTAL: 'sagittal',
      CORONAL: 'coronal',
      ACQUISITION: 'acquisition',
    },
  },
}));

describe('getCornerstoneOrientation', () => {
  it('should return AXIAL when orientation is axial', () => {
    const result = getCornerstoneOrientation('axial');
    expect(result).toBe(Enums.OrientationAxis.AXIAL);
  });

  it('should return AXIAL when orientation is AXIAL (uppercase)', () => {
    const result = getCornerstoneOrientation('AXIAL');
    expect(result).toBe(Enums.OrientationAxis.AXIAL);
  });

  it('should return SAGITTAL when orientation is sagittal', () => {
    const result = getCornerstoneOrientation('sagittal');
    expect(result).toBe(Enums.OrientationAxis.SAGITTAL);
  });

  it('should return CORONAL when orientation is coronal', () => {
    const result = getCornerstoneOrientation('coronal');
    expect(result).toBe(Enums.OrientationAxis.CORONAL);
  });

  it('should return ACQUISITION for unknown orientation', () => {
    const result = getCornerstoneOrientation('unknown');
    expect(result).toBe(Enums.OrientationAxis.ACQUISITION);
  });

  it('should return ACQUISITION when orientation is null', () => {
    const result = getCornerstoneOrientation(null);
    expect(result).toBe(Enums.OrientationAxis.ACQUISITION);
  });

  it('should return ACQUISITION when orientation is undefined', () => {
    const result = getCornerstoneOrientation(undefined);
    expect(result).toBe(Enums.OrientationAxis.ACQUISITION);
  });

  it('should return ACQUISITION when orientation is empty string', () => {
    const result = getCornerstoneOrientation('');
    expect(result).toBe(Enums.OrientationAxis.ACQUISITION);
  });

  it('should handle mixed case orientation', () => {
    const result = getCornerstoneOrientation('CoRoNaL');
    expect(result).toBe(Enums.OrientationAxis.CORONAL);
  });
});
