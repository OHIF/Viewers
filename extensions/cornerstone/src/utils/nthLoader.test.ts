import { cache, imageLoadPoolManager, Enums as csEnums } from '@cornerstonejs/core';
import interleaveNthLoader from './nthLoader';
import getNthFrames from './getNthFrames';
import interleave from './interleave';

jest.mock('@cornerstonejs/core', () => ({
  ...jest.requireActual('@cornerstonejs/core'),
  cache: {
    getVolume: jest.fn(),
  },
  imageLoadPoolManager: {
    addRequest: jest.fn(),
  },
}));

jest.mock('./getNthFrames', () => jest.fn());
jest.mock('./interleave', () => jest.fn());

describe('interleaveNthLoader', () => {
  const mockVolumeInput = {
    volumeId: 'test-volume-id',
  };

  const mockVolume = {
    metadata: {
      SeriesInstanceUID: 'test-series-uid',
    },
    getImageLoadRequests: jest.fn(),
  };

  const mockImageLoadRequest = {
    imageId: 'test-image-id',
    callLoadImage: jest.fn(),
    additionalDetails: 'test-details',
    imageIdIndex: 0,
    options: { test: 'option' },
  };

  const defaultParameters = {
    data: {
      viewportId: 'test-viewport-id',
      volumeInputArray: [mockVolumeInput],
    },
    displaySetsMatchDetails: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (cache.getVolume as jest.Mock).mockReturnValue(mockVolume);
    mockVolume.getImageLoadRequests.mockReturnValue([mockImageLoadRequest]);
    (getNthFrames as jest.Mock).mockImplementation(input => input);
    (interleave as jest.Mock).mockImplementation(input => input.flat());
  });

  it('should store viewport and volume input array mapping', () => {
    interleaveNthLoader(defaultParameters);

    expect(cache.getVolume).toHaveBeenCalledWith(mockVolumeInput.volumeId);
  });

  it('should return early when volume is not found', () => {
    (cache.getVolume as jest.Mock).mockReturnValue(null);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const result = interleaveNthLoader(defaultParameters);

    expect(consoleSpy).toHaveBeenCalledWith("interleaveNthLoader::No volume, can't load it");
    expect(result).toBeUndefined();
    expect(mockVolume.getImageLoadRequests).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should process volume input array and create image load requests', () => {
    const result = interleaveNthLoader(defaultParameters);

    expect(cache.getVolume).toHaveBeenCalledWith(mockVolumeInput.volumeId);
    expect(mockVolume.getImageLoadRequests).toHaveBeenCalled();
    expect(getNthFrames).toHaveBeenCalledWith([mockImageLoadRequest]);
    expect(interleave).toHaveBeenCalledWith([[mockImageLoadRequest]]);
    expect(result).toBeInstanceOf(Map);
  });

  it('should add requests to imageLoadPoolManager with correct parameters', () => {
    interleaveNthLoader(defaultParameters);

    expect(imageLoadPoolManager.addRequest).toHaveBeenCalledWith(
      expect.any(Function),
      csEnums.RequestType.Prefetch,
      mockImageLoadRequest.additionalDetails,
      0
    );
  });

  it('should handle multiple volume inputs', () => {
    const mockVolumeInput2 = {
      volumeId: 'test-volume-id-2',
    };

    const mockVolume2 = {
      metadata: {
        SeriesInstanceUID: 'test-series-uid-2',
      },
      getImageLoadRequests: jest.fn().mockReturnValue([mockImageLoadRequest]),
    };

    (cache.getVolume as jest.Mock)
      .mockReturnValueOnce(mockVolume)
      .mockReturnValueOnce(mockVolume2)
      .mockReturnValueOnce(mockVolume)
      .mockReturnValueOnce(mockVolume2);

    interleaveNthLoader({
      ...defaultParameters,
      data: {
        ...defaultParameters.data,
        volumeInputArray: [mockVolumeInput, mockVolumeInput2],
      },
    });

    expect(cache.getVolume).toHaveBeenCalledWith(mockVolumeInput.volumeId);
    expect(cache.getVolume).toHaveBeenCalledWith(mockVolumeInput2.volumeId);
    expect(mockVolume.getImageLoadRequests).toHaveBeenCalled();
    expect(mockVolume2.getImageLoadRequests).toHaveBeenCalled();
  });

  it('should handle volumes without getImageLoadRequests method', () => {
    const mockVolumeWithoutMethod = {
      metadata: {
        SeriesInstanceUID: 'test-series-uid',
      },
    };

    (cache.getVolume as jest.Mock)
      .mockReturnValueOnce(mockVolumeWithoutMethod)
      .mockReturnValueOnce(mockVolumeWithoutMethod);

    interleaveNthLoader(defaultParameters);

    expect(getNthFrames).not.toHaveBeenCalled();
    expect(interleave).toHaveBeenCalledWith([]);
  });

  it('should handle volumes with null getImageLoadRequests return', () => {
    mockVolume.getImageLoadRequests.mockReturnValue(null);

    interleaveNthLoader(defaultParameters);

    expect(getNthFrames).not.toHaveBeenCalled();
    expect(interleave).toHaveBeenCalledWith([]);
  });

  it('should filter out requests without imageId in first request', () => {
    const requestWithoutImageId = {
      callLoadImage: jest.fn(),
      additionalDetails: 'test-details',
    };

    mockVolume.getImageLoadRequests
      .mockReturnValueOnce([requestWithoutImageId, mockImageLoadRequest])
      .mockReturnValueOnce([mockImageLoadRequest]);

    interleaveNthLoader({
      ...defaultParameters,
      data: {
        ...defaultParameters.data,
        volumeInputArray: [mockVolumeInput, { volumeId: 'test-volume-id-2' }],
      },
    });

    expect(getNthFrames).toHaveBeenCalledWith([mockImageLoadRequest]);
  });

  it('should handle empty image load requests', () => {
    mockVolume.getImageLoadRequests.mockReturnValue([]);

    interleaveNthLoader(defaultParameters);

    expect(getNthFrames).not.toHaveBeenCalled();
    expect(interleave).toHaveBeenCalledWith([]);
  });

  it('should bind callLoadImage with correct parameters', () => {
    interleaveNthLoader(defaultParameters);

    const addRequestCall = (imageLoadPoolManager.addRequest as jest.Mock).mock.calls[0];
    const boundFunction = addRequestCall[0];

    boundFunction();

    expect(mockImageLoadRequest.callLoadImage).toHaveBeenCalledWith(
      mockImageLoadRequest.imageId,
      mockImageLoadRequest.imageIdIndex,
      mockImageLoadRequest.options
    );
  });

  it('should handle duplicate volume IDs by not adding them again', () => {
    const duplicateVolumeInput = {
      volumeId: mockVolumeInput.volumeId,
    };

    interleaveNthLoader({
      ...defaultParameters,
      data: {
        ...defaultParameters.data,
        volumeInputArray: [mockVolumeInput, duplicateVolumeInput],
      },
    });

    expect(cache.getVolume).toHaveBeenCalledTimes(3);
    expect(cache.getVolume).toHaveBeenCalledWith(mockVolumeInput.volumeId);
  });

  it('should clear internal maps after processing', () => {
    const firstResult = interleaveNthLoader(defaultParameters);
    const secondResult = interleaveNthLoader(defaultParameters);

    expect(firstResult).toBeInstanceOf(Map);
    expect(secondResult).toBeInstanceOf(Map);
    expect(firstResult.get(defaultParameters.data.viewportId)).toEqual(
      defaultParameters.data.volumeInputArray
    );
  });

  it('should handle multiple image load requests', () => {
    const mockImageLoadRequest2 = {
      imageId: 'test-image-id-2',
      callLoadImage: jest.fn(),
      additionalDetails: 'test-details-2',
      imageIdIndex: 1,
      options: { test: 'option2' },
    };

    mockVolume.getImageLoadRequests.mockReturnValue([mockImageLoadRequest, mockImageLoadRequest2]);

    (interleave as jest.Mock).mockReturnValue([mockImageLoadRequest, mockImageLoadRequest2]);

    interleaveNthLoader(defaultParameters);

    expect(imageLoadPoolManager.addRequest).toHaveBeenCalledTimes(2);
    expect(imageLoadPoolManager.addRequest).toHaveBeenNthCalledWith(
      1,
      expect.any(Function),
      csEnums.RequestType.Prefetch,
      mockImageLoadRequest.additionalDetails,
      0
    );
    expect(imageLoadPoolManager.addRequest).toHaveBeenNthCalledWith(
      2,
      expect.any(Function),
      csEnums.RequestType.Prefetch,
      mockImageLoadRequest2.additionalDetails,
      0
    );
  });

  it('should handle volume with undefined metadata', () => {
    const mockVolumeWithoutMetadata = {
      getImageLoadRequests: jest.fn().mockReturnValue([]),
    };

    (cache.getVolume as jest.Mock).mockReturnValueOnce(mockVolumeWithoutMetadata);

    expect(() => interleaveNthLoader(defaultParameters)).toThrow();
  });

  it('should return copy of viewport volume input array map', () => {
    const result = interleaveNthLoader(defaultParameters);

    expect(result.has(defaultParameters.data.viewportId)).toBe(true);
    expect(result.get(defaultParameters.data.viewportId)).toEqual(
      defaultParameters.data.volumeInputArray
    );
  });

  it('should handle requests with missing properties gracefully', () => {
    const incompleteRequest = {
      imageId: 'test-image-id',
      callLoadImage: jest.fn(),
    };

    mockVolume.getImageLoadRequests.mockReturnValue([incompleteRequest]);
    (interleave as jest.Mock).mockReturnValue([incompleteRequest]);

    interleaveNthLoader(defaultParameters);

    expect(imageLoadPoolManager.addRequest).toHaveBeenCalledWith(
      expect.any(Function),
      csEnums.RequestType.Prefetch,
      undefined,
      0
    );
  });

  it('should process different viewport IDs separately', () => {
    const firstResult = interleaveNthLoader({
      ...defaultParameters,
      data: {
        viewportId: 'viewport-1',
        volumeInputArray: [mockVolumeInput],
      },
    });

    const secondResult = interleaveNthLoader({
      ...defaultParameters,
      data: {
        viewportId: 'viewport-2',
        volumeInputArray: [mockVolumeInput],
      },
    });

    expect(firstResult.has('viewport-1')).toBe(true);
    expect(secondResult.has('viewport-2')).toBe(true);
    expect(firstResult.has('viewport-2')).toBe(false);
  });
});
