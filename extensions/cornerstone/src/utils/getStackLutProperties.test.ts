import getStackLutProperties from './getStackLutProperties';

describe('getStackLutProperties', () => {
  it('returns stack properties as they are', () => {
    const properties = { invert: true, colormap: { name: 'Grayscale' } };

    expect(getStackLutProperties(properties)).toBe(properties);
  });

  it('takes invert and window level from the properties a volume viewport saved', () => {
    const properties = new Map([
      [
        'cornerstoneStreamingImageVolume:ds-1',
        { invert: true, voiRange: { lower: 0, upper: 5 }, VOILUTFunction: 'LINEAR' },
      ],
    ]);

    expect(getStackLutProperties(properties)).toEqual({
      invert: true,
      voiRange: { lower: 0, upper: 5 },
      VOILUTFunction: 'LINEAR',
    });
  });

  it("leaves out the volume's colormap and rendering settings", () => {
    const properties = new Map([
      [
        'cornerstoneStreamingImageVolume:ds-1',
        {
          invert: true,
          colormap: { name: 'X Ray', opacity: 1 },
          interpolationType: 1,
          sharpening: 0,
          smoothing: 0,
        },
      ],
    ]);

    expect(getStackLutProperties(properties)).toEqual({ invert: true });
  });

  it('returns nothing for an empty Map or no properties', () => {
    expect(getStackLutProperties(new Map())).toBeUndefined();
    expect(getStackLutProperties(undefined)).toBeUndefined();
  });
});
