import { Enums } from '@cornerstonejs/core';
import getCornerstoneBlendMode from './getCornerstoneBlendMode';

jest.mock('@cornerstonejs/core', () => ({
  Enums: {
    BlendModes: {
      COMPOSITE: 'composite',
      MAXIMUM_INTENSITY_BLEND: 'mip',
      MINIMUM_INTENSITY_BLEND: 'minip',
      AVERAGE_INTENSITY_BLEND: 'avg',
    },
  },
}));

describe('getCornerstoneBlendMode', () => {
  it('should return COMPOSITE when blendMode is null', () => {
    const result = getCornerstoneBlendMode(null);
    expect(result).toBe(Enums.BlendModes.COMPOSITE);
  });

  it('should return COMPOSITE when blendMode is undefined', () => {
    const result = getCornerstoneBlendMode(undefined);
    expect(result).toBe(Enums.BlendModes.COMPOSITE);
  });

  it('should return COMPOSITE when blendMode is empty string', () => {
    const result = getCornerstoneBlendMode('');
    expect(result).toBe(Enums.BlendModes.COMPOSITE);
  });

  it('should return MAXIMUM_INTENSITY_BLEND when blendMode is mip', () => {
    const result = getCornerstoneBlendMode('mip');
    expect(result).toBe(Enums.BlendModes.MAXIMUM_INTENSITY_BLEND);
  });

  it('should return MAXIMUM_INTENSITY_BLEND when blendMode is MIP (uppercase)', () => {
    const result = getCornerstoneBlendMode('MIP');
    expect(result).toBe(Enums.BlendModes.MAXIMUM_INTENSITY_BLEND);
  });

  it('should return MINIMUM_INTENSITY_BLEND when blendMode is MINIP (uppercase)', () => {
    const result = getCornerstoneBlendMode('MINIP');
    expect(result).toBe(Enums.BlendModes.MINIMUM_INTENSITY_BLEND);
  });

  it('should return AVERAGE_INTENSITY_BLEND when blendMode is avg', () => {
    const result = getCornerstoneBlendMode('avg');
    expect(result).toBe(Enums.BlendModes.AVERAGE_INTENSITY_BLEND);
  });

  it('should throw error for unsupported blend mode', () => {
    expect(() => getCornerstoneBlendMode('invalid')).toThrow('Unsupported blend mode: invalid');
  });

  it('should handle mixed case blend mode', () => {
    const result = getCornerstoneBlendMode('MiP');
    expect(result).toBe(Enums.BlendModes.MAXIMUM_INTENSITY_BLEND);
  });
});
