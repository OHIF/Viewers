import getNthFrames from './getNthFrames';

describe('getNthFrames', () => {
  const createMockImageLoadRequest = (imageId: string, imageIdIndex: number) => ({
    imageId,
    callLoadImage: jest.fn(),
    additionalDetails: 'test-details',
    imageIdIndex,
    options: { test: 'option' },
  });

  it('should return empty array when input is empty', () => {
    const result = getNthFrames([]);
    expect(result).toEqual([]);
  });

  it('should return same array when input has one element', () => {
    const imageIds = [createMockImageLoadRequest('image-1', 0)];
    const result = getNthFrames(imageIds);
    expect(result).toEqual(imageIds);
  });

  it('should return same array when input has two elements', () => {
    const imageIds = [
      createMockImageLoadRequest('image-1', 0),
      createMockImageLoadRequest('image-2', 1),
    ];
    const result = getNthFrames(imageIds);
    expect(result).toEqual(imageIds);
  });

  it('should prioritize first two elements', () => {
    const imageIds = Array.from({ length: 10 }, (_, i) =>
      createMockImageLoadRequest(`image-${i}`, i)
    );
    const result = getNthFrames(imageIds);

    expect(result[0]).toBe(imageIds[0]);
    expect(result[1]).toBe(imageIds[1]);
  });

  it('should prioritize last three elements', () => {
    const imageIds = Array.from({ length: 10 }, (_, i) =>
      createMockImageLoadRequest(`image-${i}`, i)
    );
    const result = getNthFrames(imageIds);

    expect(result).toContain(imageIds[7]);
    expect(result).toContain(imageIds[8]);
    expect(result).toContain(imageIds[9]);
  });

  it('should include center elements', () => {
    const imageIds = Array.from({ length: 20 }, (_, i) =>
      createMockImageLoadRequest(`image-${i}`, i)
    );
    const result = getNthFrames(imageIds);
    const centerStart = imageIds.length / 2 - 3;
    const centerEnd = centerStart + 6;

    for (let i = Math.ceil(centerStart); i < centerEnd; i++) {
      if (i >= 0 && i < imageIds.length) {
        expect(result).toContain(imageIds[i]);
      }
    }
  });

  it('should include nth elements where i % 7 === 2', () => {
    const imageIds = Array.from({ length: 30 }, (_, i) =>
      createMockImageLoadRequest(`image-${i}`, i)
    );
    const result = getNthFrames(imageIds);

    for (let i = 0; i < imageIds.length; i++) {
      if (i % 7 === 2 && i >= 2 && i <= imageIds.length - 4) {
        const centerStart = imageIds.length / 2 - 3;
        const centerEnd = centerStart + 6;
        if (!(i > centerStart && i < centerEnd)) {
          expect(result).toContain(imageIds[i]);
        }
      }
    }
  });

  it('should include nth elements where i % 7 === 5', () => {
    const imageIds = Array.from({ length: 30 }, (_, i) =>
      createMockImageLoadRequest(`image-${i}`, i)
    );
    const result = getNthFrames(imageIds);

    for (let i = 0; i < imageIds.length; i++) {
      if (i % 7 === 5 && i >= 2 && i <= imageIds.length - 4) {
        const centerStart = imageIds.length / 2 - 3;
        const centerEnd = centerStart + 6;
        if (!(i > centerStart && i < centerEnd)) {
          expect(result).toContain(imageIds[i]);
        }
      }
    }
  });

  it('should handle large arrays correctly', () => {
    const imageIds = Array.from({ length: 100 }, (_, i) =>
      createMockImageLoadRequest(`image-${i}`, i)
    );
    const result = getNthFrames(imageIds);

    expect(result.length).toBe(100);
    expect(result[0]).toBe(imageIds[0]);
    expect(result[1]).toBe(imageIds[1]);
    expect(result).toContain(imageIds[97]);
    expect(result).toContain(imageIds[98]);
    expect(result).toContain(imageIds[99]);
  });

  it('should handle arrays where centerStart is negative', () => {
    const imageIds = Array.from({ length: 3 }, (_, i) =>
      createMockImageLoadRequest(`image-${i}`, i)
    );
    const result = getNthFrames(imageIds);

    expect(result).toEqual(imageIds);
  });

  it('should handle arrays where centerEnd exceeds length', () => {
    const imageIds = Array.from({ length: 4 }, (_, i) =>
      createMockImageLoadRequest(`image-${i}`, i)
    );
    const result = getNthFrames(imageIds);

    expect(result).toEqual(expect.arrayContaining(imageIds));
    expect(result.length).toBe(4);
  });

  it('should preserve object references', () => {
    const imageIds = Array.from({ length: 10 }, (_, i) =>
      createMockImageLoadRequest(`image-${i}`, i)
    );
    const result = getNthFrames(imageIds);

    result.forEach(item => {
      expect(imageIds).toContain(item);
    });
  });
});
