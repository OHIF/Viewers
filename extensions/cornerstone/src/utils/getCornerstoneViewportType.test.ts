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
      ECG: 'ecg',
      PLANAR_NEXT: 'planarNext',
      VOLUME_3D_NEXT: 'volume3dNext',
      VIDEO_NEXT: 'videoNext',
      WHOLE_SLIDE_NEXT: 'wholeSlideNext',
      ECG_NEXT: 'ecgNext',
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

  it('should return ECG when viewportType is ecg', () => {
    const result = getCornerstoneViewportType('ecg');
    expect(result).toBe(Enums.ViewportType.ECG);
  });

  it('should throw error for invalid viewport type', () => {
    expect(() => getCornerstoneViewportType('invalid')).toThrow(
      'Invalid viewport type: invalid. Valid types are: stack, volume, video, wholeslide, ecg'
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

  describe('useNextViewports (native Generic Viewport types)', () => {
    it('maps stack to PLANAR_NEXT', () => {
      expect(getCornerstoneViewportType('stack', undefined, true)).toBe(
        Enums.ViewportType.PLANAR_NEXT
      );
    });

    it('maps volume and orthographic to PLANAR_NEXT', () => {
      expect(getCornerstoneViewportType('volume', undefined, true)).toBe(
        Enums.ViewportType.PLANAR_NEXT
      );
      expect(getCornerstoneViewportType('orthographic', undefined, true)).toBe(
        Enums.ViewportType.PLANAR_NEXT
      );
    });

    it('maps volume3d / video / wholeslide / ecg to their *_NEXT types', () => {
      expect(getCornerstoneViewportType('volume3d', undefined, true)).toBe(
        Enums.ViewportType.VOLUME_3D_NEXT
      );
      expect(getCornerstoneViewportType('video', undefined, true)).toBe(
        Enums.ViewportType.VIDEO_NEXT
      );
      expect(getCornerstoneViewportType('wholeslide', undefined, true)).toBe(
        Enums.ViewportType.WHOLE_SLIDE_NEXT
      );
      expect(getCornerstoneViewportType('ecg', undefined, true)).toBe(
        Enums.ViewportType.ECG_NEXT
      );
    });

    it('honors the displaySet viewportType override under the flag', () => {
      const displaySets = [{ viewportType: 'volume' }] as Types.DisplaySet[];
      expect(getCornerstoneViewportType('stack', displaySets, true)).toBe(
        Enums.ViewportType.PLANAR_NEXT
      );
    });

    it('throws for an invalid viewport type under the flag', () => {
      expect(() =>
        getCornerstoneViewportType('invalid', undefined, true)
      ).toThrow('Invalid viewport type: invalid');
    });

    it('leaves the legacy mapping unchanged when the flag is off', () => {
      expect(getCornerstoneViewportType('stack', undefined, false)).toBe(
        Enums.ViewportType.STACK
      );
      expect(getCornerstoneViewportType('volume', undefined, false)).toBe(
        Enums.ViewportType.ORTHOGRAPHIC
      );
    });

    it('is idempotent for already-native types regardless of the flag', () => {
      // A viewport's stored cs type can be re-fed into the mapper.
      expect(getCornerstoneViewportType('planarNext', undefined, false)).toBe(
        Enums.ViewportType.PLANAR_NEXT
      );
      expect(getCornerstoneViewportType('planarNext', undefined, true)).toBe(
        Enums.ViewportType.PLANAR_NEXT
      );
      expect(getCornerstoneViewportType('volume3dNext', undefined, true)).toBe(
        Enums.ViewportType.VOLUME_3D_NEXT
      );
    });
  });
});
