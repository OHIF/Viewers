import { cache, imageLoader } from '@cornerstonejs/core';
import { loadReferencedImages } from './loadReferencedImages';

jest.mock('@cornerstonejs/core', () => ({
  cache: { getImage: jest.fn() },
  imageLoader: { loadAndCacheImage: jest.fn(() => Promise.resolve()) },
}));

const cachedImages = {
  'seg:1': { referencedImageId: 'ct:1' },
  'seg:2': { referencedImageId: 'ct:2' },
  'ct:1': {},
};

describe('loadReferencedImages', () => {
  beforeEach(() => {
    jest.mocked(cache.getImage).mockImplementation(imageId => cachedImages[imageId]);
    jest.mocked(imageLoader.loadAndCacheImage).mockClear();
  });

  it('loads only the referenced images that are not in the cache, once each', async () => {
    await loadReferencedImages({
      imageIds: ['seg:1', 'seg:2'],
      referencedImageIds: ['ct:1', 'ct:2', 'ct:3'],
      labelmaps: { layer: { imageIds: ['seg:2'], referencedImageIds: ['ct:3'] } },
    } as never);

    expect(jest.mocked(imageLoader.loadAndCacheImage).mock.calls).toEqual([['ct:2'], ['ct:3']]);
  });

  it('does nothing without labelmap data', async () => {
    await loadReferencedImages(undefined);

    expect(imageLoader.loadAndCacheImage).not.toHaveBeenCalled();
  });
});
