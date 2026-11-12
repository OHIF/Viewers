import { cache, imageLoadPoolManager, Enums } from '@cornerstonejs/core';
import getInterleavedFrames from './getInterleavedFrames';
import zip from 'lodash.zip';
import compact from 'lodash.compact';
import flatten from 'lodash.flatten';
import interleaveCenterLoader from './interleaveCenterLoader';

jest.mock('@cornerstonejs/core', () => ({
  cache: {
    getVolume: jest.fn(),
  },
  imageLoadPoolManager: {
    addRequest: jest.fn(),
  },
  Enums: {
    RequestType: {
      Prefetch: 'Prefetch',
    },
  },
}));

jest.mock('./getInterleavedFrames', () => jest.fn());
jest.mock('lodash.zip', () => jest.fn());
jest.mock('lodash.compact', () => jest.fn());
jest.mock('lodash.flatten', () => jest.fn());

describe('interleaveCenterLoader', () => {
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

  const mockDisplaySetsInfo = [
    {
      displaySetInstanceUID: 'test-volume-id',
      displaySetOptions: {},
    },
  ];

  const mockMatchDetails = new Map([
    [
      'viewport-1',
      {
        displaySetsInfo: mockDisplaySetsInfo,
      },
    ],
  ]);

  const defaultParameters = {
    data: {
      viewportId: 'test-viewport-id',
      volumeInputArray: [mockVolumeInput],
    },
    displaySetsMatchDetails: {},
    viewportMatchDetails: mockMatchDetails,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (cache.getVolume as jest.Mock).mockReturnValue(mockVolume);
    mockVolume.getImageLoadRequests.mockReturnValue([mockImageLoadRequest]);
    (getInterleavedFrames as jest.Mock).mockReturnValue([{ imageId: 'test-image-id' }]);
    (zip as jest.Mock).mockImplementation((...args) => args[0]);
    (compact as jest.Mock).mockImplementation(input => input?.filter(Boolean) ?? []);
    (flatten as jest.Mock).mockImplementation(input => input?.flat() ?? []);
  });

  it('should store viewport and volume input array mapping on first call', () => {
    interleaveCenterLoader(defaultParameters);

    expect(cache.getVolume).toHaveBeenCalledWith(mockVolumeInput.volumeId);
  });

  it('should return early when volume is not found', () => {
    (cache.getVolume as jest.Mock).mockReturnValue(null);

    const result = interleaveCenterLoader(defaultParameters);

    expect(result).toBeUndefined();
    expect(mockVolume.getImageLoadRequests).not.toHaveBeenCalled();
  });

  it('should return early when volume input array size does not match display set UIDs', () => {
    const mockMatchDetailsWithDifferentSize = new Map([
      [
        'viewport-1',
        {
          displaySetsInfo: [
            { displaySetInstanceUID: 'display-set-1' },
            { displaySetInstanceUID: 'display-set-2' },
          ],
        },
      ],
    ]);

    const result = interleaveCenterLoader({
      ...defaultParameters,
      viewportMatchDetails: mockMatchDetailsWithDifferentSize,
    });

    expect(result).toBeUndefined();
  });

  it('should process volume and create interleaved requests', () => {
    const result = interleaveCenterLoader(defaultParameters);

    expect(cache.getVolume).toHaveBeenCalledWith(mockVolumeInput.volumeId);
    expect(mockVolume.getImageLoadRequests).toHaveBeenCalled();
    expect(getInterleavedFrames).toHaveBeenCalledWith(['test-image-id']);
    expect(zip).toHaveBeenCalled();
    expect(compact).toHaveBeenCalled();
    expect(flatten).toHaveBeenCalled();
    expect(result).toBeInstanceOf(Map);
  });

  it('should add requests to imageLoadPoolManager with correct parameters', () => {
    interleaveCenterLoader(defaultParameters);

    expect(imageLoadPoolManager.addRequest).toHaveBeenCalledWith(
      expect.any(Function),
      Enums.RequestType.Prefetch,
      mockImageLoadRequest.additionalDetails,
      0
    );
  });

  it('should bind callLoadImage with correct parameters', () => {
    interleaveCenterLoader(defaultParameters);

    const addRequestCall = (imageLoadPoolManager.addRequest as jest.Mock).mock.calls[0];
    const boundFunction = addRequestCall[0];

    boundFunction();

    expect(mockImageLoadRequest.callLoadImage).toHaveBeenCalledWith(
      mockImageLoadRequest.imageId,
      mockImageLoadRequest.imageIdIndex,
      mockImageLoadRequest.options
    );
  });

  it('should handle volumes without image load requests', () => {
    mockVolume.getImageLoadRequests.mockReturnValue([]);

    const result = interleaveCenterLoader(defaultParameters);

    expect(zip).toHaveBeenCalledWith();
    expect(result).toBeInstanceOf(Map);
  });

  it('should handle volumes with empty requests array', () => {
    mockVolume.getImageLoadRequests.mockReturnValue([]);

    const result = interleaveCenterLoader(defaultParameters);

    expect(getInterleavedFrames).not.toHaveBeenCalled();
    expect(result).toBeInstanceOf(Map);
  });

  it('should handle volumes with null first request', () => {
    mockVolume.getImageLoadRequests.mockReturnValue([null]);

    const result = interleaveCenterLoader(defaultParameters);

    expect(getInterleavedFrames).not.toHaveBeenCalled();
    expect(result).toBeInstanceOf(Map);
  });

  it('should handle volumes with requests without imageId', () => {
    const requestWithoutImageId = {
      callLoadImage: jest.fn(),
      additionalDetails: 'test-details',
    };

    mockVolume.getImageLoadRequests.mockReturnValue([requestWithoutImageId]);

    const result = interleaveCenterLoader(defaultParameters);

    expect(getInterleavedFrames).not.toHaveBeenCalled();
    expect(result).toBeInstanceOf(Map);
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

    const mockMatchDetailsWithMultipleVolumes = new Map([
      [
        'viewport-1',
        {
          displaySetsInfo: [
            { displaySetInstanceUID: 'test-volume-id' },
            { displaySetInstanceUID: 'test-volume-id-2' },
          ],
        },
      ],
    ]);

    interleaveCenterLoader({
      ...defaultParameters,
      data: {
        ...defaultParameters.data,
        volumeInputArray: [mockVolumeInput, mockVolumeInput2],
      },
      viewportMatchDetails: mockMatchDetailsWithMultipleVolumes,
    });

    expect(cache.getVolume).toHaveBeenCalledWith(mockVolumeInput.volumeId);
    expect(cache.getVolume).toHaveBeenCalledWith(mockVolumeInput2.volumeId);
  });

  it('should handle duplicate volume IDs by not adding them again', () => {
    const duplicateVolumeInput = {
      volumeId: mockVolumeInput.volumeId,
    };

    interleaveCenterLoader({
      ...defaultParameters,
      data: {
        ...defaultParameters.data,
        volumeInputArray: [mockVolumeInput, duplicateVolumeInput],
      },
    });

    expect(cache.getVolume).toHaveBeenCalledTimes(3);
  });

  it('should clear internal maps after processing', () => {
    const firstResult = interleaveCenterLoader(defaultParameters);
    const secondResult = interleaveCenterLoader(defaultParameters);

    expect(firstResult).toBeInstanceOf(Map);
    expect(secondResult).toBeInstanceOf(Map);
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

    (getInterleavedFrames as jest.Mock).mockReturnValue([
      { imageId: 'test-image-id' },
      { imageId: 'test-image-id-2' },
    ]);

    (compact as jest.Mock).mockReturnValue([mockImageLoadRequest, mockImageLoadRequest2]);
    (flatten as jest.Mock).mockReturnValue([mockImageLoadRequest, mockImageLoadRequest2]);

    interleaveCenterLoader(defaultParameters);

    expect(getInterleavedFrames).toHaveBeenCalledWith(['test-image-id', 'test-image-id-2']);
    expect(imageLoadPoolManager.addRequest).toHaveBeenCalledTimes(2);
  });

  it('should handle getInterleavedFrames returning empty array', () => {
    (getInterleavedFrames as jest.Mock).mockReturnValue([]);

    const result = interleaveCenterLoader(defaultParameters);

    expect(imageLoadPoolManager.addRequest).not.toHaveBeenCalled();
    expect(result).toBeInstanceOf(Map);
  });

  it('should handle zip returning empty result', () => {
    (zip as jest.Mock).mockReturnValue([]);

    const result = interleaveCenterLoader(defaultParameters);

    expect(compact).toHaveBeenCalledWith([]);
    expect(result).toBeInstanceOf(Map);
  });

  it('should handle compact filtering out null values', () => {
    (compact as jest.Mock).mockReturnValue([]);

    const result = interleaveCenterLoader(defaultParameters);

    expect(imageLoadPoolManager.addRequest).not.toHaveBeenCalled();
    expect(result).toBeInstanceOf(Map);
  });

  it('should map imageIds to requests correctly', () => {
    const mockImageLoadRequest2 = {
      imageId: 'test-image-id-2',
      callLoadImage: jest.fn(),
    };

    mockVolume.getImageLoadRequests.mockReturnValue([mockImageLoadRequest, mockImageLoadRequest2]);

    (getInterleavedFrames as jest.Mock).mockReturnValue([
      { imageId: 'test-image-id-2' },
      { imageId: 'test-image-id' },
    ]);

    interleaveCenterLoader(defaultParameters);

    expect(getInterleavedFrames).toHaveBeenCalledWith(['test-image-id', 'test-image-id-2']);
  });

  it('should return copy of viewport volume input array map', () => {
    const result = interleaveCenterLoader(defaultParameters);

    expect(result.has(defaultParameters.data.viewportId)).toBe(true);
    expect(result.get(defaultParameters.data.viewportId)).toEqual(
      defaultParameters.data.volumeInputArray
    );
  });

  it('should handle multiple match details with different displaySets', () => {
    const mockMultipleMatchDetails = new Map([
      [
        'viewport-1',
        {
          displaySetsInfo: [{ displaySetInstanceUID: 'display-set-1' }],
        },
      ],
      [
        'viewport-2',
        {
          displaySetsInfo: [{ displaySetInstanceUID: 'display-set-2' }],
        },
      ],
    ]);

    const result = interleaveCenterLoader({
      ...defaultParameters,
      viewportMatchDetails: mockMultipleMatchDetails,
    });

    expect(result).toBeUndefined();
  });

  it('should handle empty match details', () => {
    const emptyMatchDetails = new Map();

    const result = interleaveCenterLoader({
      ...defaultParameters,
      viewportMatchDetails: emptyMatchDetails,
    });

    expect(result).toBeUndefined();
  });

  it('should handle empty volumeInputArray', () => {
    const result = interleaveCenterLoader({
      ...defaultParameters,
      data: {
        ...defaultParameters.data,
        volumeInputArray: [],
      },
    });

    expect(result).toBeUndefined();
  });

  it('should handle requests with missing properties gracefully', () => {
    const incompleteRequest = {
      imageId: 'test-image-id',
      callLoadImage: jest.fn(),
    };

    mockVolume.getImageLoadRequests.mockReturnValue([incompleteRequest]);
    (getInterleavedFrames as jest.Mock).mockReturnValue([{ imageId: 'test-image-id' }]);
    (compact as jest.Mock).mockReturnValue([incompleteRequest]);
    (flatten as jest.Mock).mockReturnValue([incompleteRequest]);

    interleaveCenterLoader(defaultParameters);

    expect(imageLoadPoolManager.addRequest).toHaveBeenCalledWith(
      expect.any(Function),
      Enums.RequestType.Prefetch,
      undefined,
      0
    );
  });

  it('should process different viewport IDs separately', () => {
    const firstResult = interleaveCenterLoader({
      ...defaultParameters,
      data: {
        viewportId: 'viewport-1',
        volumeInputArray: [mockVolumeInput],
      },
    });

    const secondResult = interleaveCenterLoader({
      ...defaultParameters,
      data: {
        viewportId: 'viewport-2',
        volumeInputArray: [mockVolumeInput],
      },
    });

    expect(firstResult.has('viewport-1')).toBe(true);
    expect(secondResult.has('viewport-2')).toBe(true);
  });

  it('should accumulate state across multiple calls before processing', () => {
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
      .mockReturnValueOnce(mockVolume)
      .mockReturnValueOnce(mockVolume2);

    const firstCall = interleaveCenterLoader({
      ...defaultParameters,
      data: {
        viewportId: 'viewport-1',
        volumeInputArray: [mockVolumeInput],
      },
      viewportMatchDetails: new Map([
        [
          'viewport-1',
          {
            displaySetsInfo: [
              { displaySetInstanceUID: 'test-volume-id' },
              { displaySetInstanceUID: 'missing-volume-id' },
            ],
          },
        ],
      ]),
    });

    expect(firstCall).toBeUndefined();

    const secondCall = interleaveCenterLoader({
      ...defaultParameters,
      data: {
        viewportId: 'viewport-2',
        volumeInputArray: [mockVolumeInput2],
      },
      viewportMatchDetails: new Map([
        [
          'viewport-1',
          {
            displaySetsInfo: [{ displaySetInstanceUID: 'test-volume-id' }],
          },
        ],
        [
          'viewport-2',
          {
            displaySetsInfo: [{ displaySetInstanceUID: 'test-volume-id-2' }],
          },
        ],
      ]),
    });

    expect(secondCall).toBeInstanceOf(Map);
    expect(secondCall.has('viewport-1')).toBe(true);
    expect(secondCall.has('viewport-2')).toBe(true);
  });

  it('should handle volume with undefined metadata', () => {
    const mockVolumeWithoutMetadata = {
      getImageLoadRequests: jest.fn().mockReturnValue([]),
    };

    (cache.getVolume as jest.Mock).mockReturnValue(mockVolumeWithoutMetadata);

    expect(() => interleaveCenterLoader(defaultParameters)).toThrow();
  });

  it('should handle multiple volumes with same image requests', () => {
    const mockVolume2 = {
      metadata: { SeriesInstanceUID: 'test-series-uid-2' },
      getImageLoadRequests: jest.fn().mockReturnValue([mockImageLoadRequest]),
    };

    const mockVolumeInput2 = { volumeId: 'test-volume-id-2' };

    (cache.getVolume as jest.Mock)
      .mockReturnValueOnce(mockVolume)
      .mockReturnValueOnce(mockVolume2)
      .mockReturnValueOnce(mockVolume)
      .mockReturnValueOnce(mockVolume2);

    const mockMatchDetailsWithBothVolumes = new Map([
      [
        'viewport-1',
        {
          displaySetsInfo: [
            { displaySetInstanceUID: 'test-volume-id' },
            { displaySetInstanceUID: 'test-volume-id-2' },
          ],
        },
      ],
    ]);

    (compact as jest.Mock).mockReturnValue([mockImageLoadRequest]);
    (flatten as jest.Mock).mockReturnValue([mockImageLoadRequest]);

    interleaveCenterLoader({
      ...defaultParameters,
      data: {
        ...defaultParameters.data,
        volumeInputArray: [mockVolumeInput, mockVolumeInput2],
      },
      viewportMatchDetails: mockMatchDetailsWithBothVolumes,
    });

    expect(imageLoadPoolManager.addRequest).toHaveBeenCalledTimes(2);
  });
});
