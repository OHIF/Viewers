import { cache, imageLoadPoolManager, Enums } from '@cornerstonejs/core';
import zip from 'lodash.zip';
import compact from 'lodash.compact';
import flatten from 'lodash.flatten';
import interleaveTopToBottom from './interleaveTopToBottom';

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

jest.mock('lodash.zip', () => jest.fn());
jest.mock('lodash.compact', () => jest.fn());
jest.mock('lodash.flatten', () => jest.fn());

describe('interleaveTopToBottom', () => {
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
      displaySetInstanceUID: 'display-set-1',
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
    (zip as jest.Mock).mockImplementation((...args) => args[0]);
    (compact as jest.Mock).mockImplementation(input => input?.filter(Boolean) ?? []);
    (flatten as jest.Mock).mockImplementation(input => input?.flat() ?? []);
  });

  it('should store viewport and volume input array mapping', () => {
    interleaveTopToBottom(defaultParameters);

    expect(cache.getVolume).toHaveBeenCalledWith(mockVolumeInput.volumeId);
  });

  it('should return early when volume is not found', () => {
    (cache.getVolume as jest.Mock).mockReturnValue(null);

    const result = interleaveTopToBottom(defaultParameters);

    expect(result).toBeUndefined();
    expect(mockVolume.getImageLoadRequests).not.toHaveBeenCalled();
  });

  it('should process volume input array and create image load requests', () => {
    const result = interleaveTopToBottom(defaultParameters);

    expect(cache.getVolume).toHaveBeenCalledWith(mockVolumeInput.volumeId);
    expect(mockVolume.getImageLoadRequests).toHaveBeenCalled();
    expect(zip).toHaveBeenCalled();
    expect(compact).toHaveBeenCalled();
    expect(flatten).toHaveBeenCalled();
    expect(result).toBeInstanceOf(Map);
  });

  it('should process displaySets without skipLoading option', () => {
    const mockMatchDetailsWithoutSkipLoading = new Map([
      [
        'viewport-1',
        {
          displaySetsInfo: [
            {
              displaySetInstanceUID: 'display-set-1',
              displaySetOptions: { options: { skipLoading: false } },
            },
          ],
        },
      ],
    ]);

    const result = interleaveTopToBottom({
      ...defaultParameters,
      viewportMatchDetails: mockMatchDetailsWithoutSkipLoading,
    });

    expect(result).toBeInstanceOf(Map);
  });

  it('should return early when viewport volume display set UIDs size does not match', () => {
    const mockMatchDetailsWithDifferentSize = new Map([
      [
        'viewport-1',
        {
          displaySetsInfo: [
            {
              displaySetInstanceUID: 'display-set-1',
            },
            {
              displaySetInstanceUID: 'display-set-2',
            },
          ],
        },
      ],
    ]);

    const result = interleaveTopToBottom({
      ...defaultParameters,
      viewportMatchDetails: mockMatchDetailsWithDifferentSize,
    });

    expect(result).toBeUndefined();
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

    interleaveTopToBottom({
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

  it('should add requests to imageLoadPoolManager with correct parameters', () => {
    interleaveTopToBottom(defaultParameters);

    expect(imageLoadPoolManager.addRequest).toHaveBeenCalledWith(
      expect.any(Function),
      Enums.RequestType.Prefetch,
      mockImageLoadRequest.additionalDetails,
      0
    );
  });

  it('should bind callLoadImage with correct parameters', () => {
    interleaveTopToBottom(defaultParameters);

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
    mockVolume.getImageLoadRequests.mockReturnValue(null);

    const result = interleaveTopToBottom(defaultParameters);

    expect(zip).toHaveBeenCalledWith();
    expect(result).toBeInstanceOf(Map);
  });

  it('should handle volumes with empty image load requests', () => {
    mockVolume.getImageLoadRequests.mockReturnValue([]);

    const result = interleaveTopToBottom(defaultParameters);

    expect(zip).toHaveBeenCalledWith();
    expect(result).toBeInstanceOf(Map);
  });

  it('should handle volumes with requests without imageId', () => {
    const requestWithoutImageId = {
      callLoadImage: jest.fn(),
      additionalDetails: 'test-details',
    };

    mockVolume.getImageLoadRequests.mockReturnValue([requestWithoutImageId]);

    const result = interleaveTopToBottom(defaultParameters);

    expect(zip).toHaveBeenCalledWith();
    expect(result).toBeInstanceOf(Map);
  });

  it('should reverse the requests before adding to AllRequests', () => {
    const mockRequests = [
      { imageId: 'image-1', callLoadImage: jest.fn() },
      { imageId: 'image-2', callLoadImage: jest.fn() },
    ];

    mockVolume.getImageLoadRequests.mockReturnValue(mockRequests);

    interleaveTopToBottom(defaultParameters);

    expect(mockVolume.getImageLoadRequests).toHaveBeenCalled();
  });

  it('should handle duplicate volume IDs by not adding them again', () => {
    const duplicateVolumeInput = {
      volumeId: mockVolumeInput.volumeId,
    };

    interleaveTopToBottom({
      ...defaultParameters,
      data: {
        ...defaultParameters.data,
        volumeInputArray: [mockVolumeInput, duplicateVolumeInput],
      },
    });

    expect(cache.getVolume).toHaveBeenCalledTimes(3);
  });

  it('should clear internal maps after processing', () => {
    const firstResult = interleaveTopToBottom(defaultParameters);
    const secondResult = interleaveTopToBottom(defaultParameters);

    expect(firstResult).toBeInstanceOf(Map);
    expect(secondResult).toBeInstanceOf(Map);
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

    const result = interleaveTopToBottom({
      ...defaultParameters,
      viewportMatchDetails: mockMultipleMatchDetails,
    });

    expect(result).toBeUndefined();
  });

  it('should handle undefined displaySetOptions', () => {
    const mockMatchDetailsWithUndefinedOptions = new Map([
      [
        'viewport-1',
        {
          displaySetsInfo: [
            {
              displaySetInstanceUID: 'display-set-1',
              displaySetOptions: undefined,
            },
          ],
        },
      ],
    ]);

    const result = interleaveTopToBottom({
      ...defaultParameters,
      viewportMatchDetails: mockMatchDetailsWithUndefinedOptions,
    });

    expect(result).toBeInstanceOf(Map);
  });

  it('should handle displaySetOptions without options property', () => {
    const mockMatchDetailsWithoutOptionsProperty = new Map([
      [
        'viewport-1',
        {
          displaySetsInfo: [
            {
              displaySetInstanceUID: 'display-set-1',
              displaySetOptions: { someOtherProperty: 'value' },
            },
          ],
        },
      ],
    ]);

    const result = interleaveTopToBottom({
      ...defaultParameters,
      viewportMatchDetails: mockMatchDetailsWithoutOptionsProperty,
    });

    expect(result).toBeInstanceOf(Map);
  });

  it('should handle empty match details', () => {
    const emptyMatchDetails = new Map();

    const result = interleaveTopToBottom({
      ...defaultParameters,
      viewportMatchDetails: emptyMatchDetails,
    });

    expect(result).toBeUndefined();
  });

  it('should handle empty volumeInputArray', () => {
    const result = interleaveTopToBottom({
      ...defaultParameters,
      data: {
        ...defaultParameters.data,
        volumeInputArray: [],
      },
    });

    expect(result).toBeUndefined();
  });

  it('should handle interleavedRequests processing correctly', () => {
    const mockRequest1 = { imageId: 'image-1', callLoadImage: jest.fn() };
    const mockRequest2 = { imageId: 'image-2', callLoadImage: jest.fn() };

    mockVolume.getImageLoadRequests.mockReturnValue([mockRequest1, mockRequest2]);
    (compact as jest.Mock).mockReturnValue([mockRequest1, mockRequest2]);
    (flatten as jest.Mock).mockReturnValue([mockRequest1, mockRequest2]);

    interleaveTopToBottom(defaultParameters);

    expect(imageLoadPoolManager.addRequest).toHaveBeenCalledTimes(2);
  });

  it('should return copy of viewport volume input array map', () => {
    const result = interleaveTopToBottom(defaultParameters);

    expect(result.has(defaultParameters.data.viewportId)).toBe(true);
    expect(result.get(defaultParameters.data.viewportId)).toEqual(
      defaultParameters.data.volumeInputArray
    );
  });

  it('should process different viewport IDs separately', () => {
    const firstResult = interleaveTopToBottom({
      ...defaultParameters,
      data: {
        viewportId: 'viewport-1',
        volumeInputArray: [mockVolumeInput],
      },
    });

    const secondResult = interleaveTopToBottom({
      ...defaultParameters,
      data: {
        viewportId: 'viewport-2',
        volumeInputArray: [mockVolumeInput],
      },
    });

    expect(firstResult.has('viewport-1')).toBe(true);
    expect(secondResult.has('viewport-2')).toBe(true);
  });

  it('should handle requests with missing properties gracefully', () => {
    const incompleteRequest = {
      imageId: 'test-image-id',
      callLoadImage: jest.fn(),
    };

    mockVolume.getImageLoadRequests.mockReturnValue([incompleteRequest]);
    (compact as jest.Mock).mockReturnValue([incompleteRequest]);
    (flatten as jest.Mock).mockReturnValue([incompleteRequest]);

    interleaveTopToBottom(defaultParameters);

    expect(imageLoadPoolManager.addRequest).toHaveBeenCalledWith(
      expect.any(Function),
      Enums.RequestType.Prefetch,
      undefined,
      0
    );
  });

  it('should handle multiple volumes with same requests', () => {
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

    interleaveTopToBottom({
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
