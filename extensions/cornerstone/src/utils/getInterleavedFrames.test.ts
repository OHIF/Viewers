import getInterleavedFrames from './getInterleavedFrames';

describe('getInterleavedFrames', () => {
  it('should return single element when input has one element', () => {
    const imageIds = ['image-1'];
    const result = getInterleavedFrames(imageIds);

    expect(result).toEqual([{ imageId: 'image-1', imageIdIndex: 0 }]);
  });

  it('should return correct order for three elements', () => {
    const imageIds = ['image-1', 'image-2', 'image-3'];
    const result = getInterleavedFrames(imageIds);

    expect(result).toEqual([
      { imageId: 'image-2', imageIdIndex: 1 },
      { imageId: 'image-1', imageIdIndex: 0 },
      { imageId: 'image-3', imageIdIndex: 2 },
    ]);
  });

  it('should start with middle element', () => {
    const imageIds = ['image-1', 'image-2', 'image-3', 'image-4', 'image-5'];
    const result = getInterleavedFrames(imageIds);

    expect(result[0]).toEqual({ imageId: 'image-3', imageIdIndex: 2 });
  });

  it('should interleave elements correctly for even length array', () => {
    const imageIds = ['image-1', 'image-2', 'image-3', 'image-4', 'image-5', 'image-6'];
    const result = getInterleavedFrames(imageIds);

    expect(result).toEqual([
      { imageId: 'image-4', imageIdIndex: 3 },
      { imageId: 'image-3', imageIdIndex: 2 },
      { imageId: 'image-5', imageIdIndex: 4 },
      { imageId: 'image-2', imageIdIndex: 1 },
      { imageId: 'image-6', imageIdIndex: 5 },
      { imageId: 'image-1', imageIdIndex: 0 },
    ]);
  });

  it('should interleave elements correctly for odd length array', () => {
    const imageIds = ['image-1', 'image-2', 'image-3', 'image-4', 'image-5', 'image-6', 'image-7'];
    const result = getInterleavedFrames(imageIds);

    expect(result).toEqual([
      { imageId: 'image-4', imageIdIndex: 3 },
      { imageId: 'image-3', imageIdIndex: 2 },
      { imageId: 'image-5', imageIdIndex: 4 },
      { imageId: 'image-2', imageIdIndex: 1 },
      { imageId: 'image-6', imageIdIndex: 5 },
      { imageId: 'image-1', imageIdIndex: 0 },
      { imageId: 'image-7', imageIdIndex: 6 },
    ]);
  });

  it('should handle large array correctly', () => {
    const imageIds = Array.from({ length: 10 }, (_, i) => `image-${i + 1}`);
    const result = getInterleavedFrames(imageIds);

    expect(result).toHaveLength(10);
    expect(result[0]).toEqual({ imageId: 'image-6', imageIdIndex: 5 });
    expect(result[8]).toEqual({ imageId: 'image-10', imageIdIndex: 9 });
    expect(result[9]).toEqual({ imageId: 'image-1', imageIdIndex: 0 });
  });

  it('should handle empty array', () => {
    const imageIds = [];
    const result = getInterleavedFrames(imageIds);

    expect(result).toEqual([]);
  });

  it('should handle duplicate imageIds with different indices', () => {
    const imageIds = ['duplicate', 'unique', 'duplicate'];
    const result = getInterleavedFrames(imageIds);

    expect(result).toEqual([
      { imageId: 'unique', imageIdIndex: 1 },
      { imageId: 'duplicate', imageIdIndex: 0 },
      { imageId: 'duplicate', imageIdIndex: 2 },
    ]);
  });
});
