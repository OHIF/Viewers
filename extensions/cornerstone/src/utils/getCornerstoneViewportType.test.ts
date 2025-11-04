import type { Types } from '@ohif/core';
import { Enums } from '@cornerstonejs/core';
import getCornerstoneViewportType from './getCornerstoneViewportType';

jest.mock('@cornerstonejs/core', () => ({
  Enums: {
    ViewportType: {
      STACK: 'stack',
      VIDEO: 'video',
      WHOLE_SLIDE: 'wholeslide',
      ORTHOGRAPHIC: 'orthographic',
      VOLUME_3D: 'volume3d',
    },
  },
}));

describe('getCornerstoneViewportType', () => {
  it('should return STACK when viewportType is stack', () => {
    const result = getCornerstoneViewportType('stack');
    expect(result).toBe(Enums.ViewportType.STACK);
  });

  it('should return STACK when viewportType is STACK (uppercase)', () => {
    const result = getCornerstoneViewportType('STACK');
    expect(result).toBe(Enums.ViewportType.STACK);
  });

  it('should return VIDEO when viewportType is video', () => {
    const result = getCornerstoneViewportType('video');
    expect(result).toBe(Enums.ViewportType.VIDEO);
  });

  it('should return WHOLE_SLIDE when viewportType is wholeslide', () => {
    const result = getCornerstoneViewportType('wholeslide');
    expect(result).toBe(Enums.ViewportType.WHOLE_SLIDE);
  });

  it('should return ORTHOGRAPHIC when viewportType is volume', () => {
    const result = getCornerstoneViewportType('volume');
    expect(result).toBe(Enums.ViewportType.ORTHOGRAPHIC);
  });

  it('should return ORTHOGRAPHIC when viewportType is orthographic', () => {
    const result = getCornerstoneViewportType('orthographic');
    expect(result).toBe(Enums.ViewportType.ORTHOGRAPHIC);
  });

  it('should return VOLUME_3D when viewportType is volume3d', () => {
    const result = getCornerstoneViewportType('volume3d');
    expect(result).toBe(Enums.ViewportType.VOLUME_3D);
  });

  it('should throw error for invalid viewport type', () => {
    expect(() => getCornerstoneViewportType('invalid')).toThrow(
      'Invalid viewport type: invalid. Valid types are: stack, volume, video, wholeslide'
    );
  });

  it('should use displaySet viewportType when provided', () => {
    const displaySets = [{ viewportType: 'stack' }] as Types.DisplaySet[];
    const result = getCornerstoneViewportType('volume', displaySets);
    expect(result).toBe(Enums.ViewportType.STACK);
  });

  it('should use displaySet viewportType with case insensitive matching', () => {
    const displaySets = [{ viewportType: 'VIDEO' }] as Types.DisplaySet[];
    const result = getCornerstoneViewportType('stack', displaySets);
    expect(result).toBe(Enums.ViewportType.VIDEO);
  });

  it('should fallback to viewportType when displaySet has no viewportType', () => {
    const displaySets = [{}] as Types.DisplaySet[];
    const result = getCornerstoneViewportType('volume', displaySets);
    expect(result).toBe(Enums.ViewportType.ORTHOGRAPHIC);
  });

  it('should handle empty displaySets array', () => {
    const result = getCornerstoneViewportType('stack', []);
    expect(result).toBe(Enums.ViewportType.STACK);
  });

  it('should handle null displaySets', () => {
    const result = getCornerstoneViewportType('video', null);
    expect(result).toBe(Enums.ViewportType.VIDEO);
  });

  it('should handle undefined displaySets', () => {
    const result = getCornerstoneViewportType('wholeslide', undefined);
    expect(result).toBe(Enums.ViewportType.WHOLE_SLIDE);
  });
});
