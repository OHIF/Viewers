import * as cornerstoneTools from '@cornerstonejs/tools';
import {
  setupSegmentationDataModifiedHandler,
  setupSegmentationModifiedHandler,
} from './segmentationHandlers';
import { updateSegmentationStats } from './updateSegmentationStats';

jest.mock('@cornerstonejs/tools', () => ({
  annotation: {
    state: {
      getAllAnnotations: jest.fn(),
      removeAnnotation: jest.fn(),
    },
  },
  SegmentBidirectionalTool: {
    toolName: 'SegmentBidirectional',
  },
}));

jest.mock('./updateSegmentationStats', () => ({
  updateSegmentationStats: jest.fn(),
}));

describe('setupSegmentationDataModifiedHandler', () => {
  const mockSegmentationService = {
    EVENTS: {
      SEGMENTATION_DATA_MODIFIED: 'SEGMENTATION_DATA_MODIFIED',
    },
    subscribeDebounced: jest.fn(),
    getSegmentation: jest.fn(),
    addOrUpdateSegmentation: jest.fn(),
  };

  const mockCustomizationService = {
    getCustomization: jest.fn(),
  };

  const mockCommandsManager = {
    runCommand: jest.fn(),
  };

  const mockUnsubscribeDebounced = jest.fn();

  const defaultParameters = {
    segmentationService: mockSegmentationService,
    customizationService: mockCustomizationService,
    commandsManager: mockCommandsManager,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSegmentationService.subscribeDebounced.mockReturnValue({
      unsubscribe: mockUnsubscribeDebounced,
    });
    (updateSegmentationStats as jest.Mock).mockResolvedValue(null);
  });

  it('should subscribe to SEGMENTATION_DATA_MODIFIED event with debounce', () => {
    setupSegmentationDataModifiedHandler(defaultParameters);

    expect(mockSegmentationService.subscribeDebounced).toHaveBeenCalledWith(
      mockSegmentationService.EVENTS.SEGMENTATION_DATA_MODIFIED,
      expect.any(Function),
      1000
    );
  });

  it('should return unsubscribe function', () => {
    const result = setupSegmentationDataModifiedHandler(defaultParameters);

    expect(result).toEqual({
      unsubscribe: expect.any(Function),
    });

    result.unsubscribe();

    expect(mockUnsubscribeDebounced).toHaveBeenCalled();
  });

  it('should return early when segmentation is null', async () => {
    mockSegmentationService.getSegmentation.mockReturnValue(null);

    setupSegmentationDataModifiedHandler(defaultParameters);

    const callback = mockSegmentationService.subscribeDebounced.mock.calls[0][1];
    await callback({ segmentationId: 'test-id' });

    expect(mockSegmentationService.getSegmentation).toHaveBeenCalledWith('test-id');
    expect(updateSegmentationStats).not.toHaveBeenCalled();
    expect(mockSegmentationService.addOrUpdateSegmentation).not.toHaveBeenCalled();
  });

  it('should return early when disableUpdateSegmentationStats is true', async () => {
    const mockSegmentation = {
      segments: {
        1: { segmentIndex: 1 },
      },
    };

    mockSegmentationService.getSegmentation.mockReturnValue(mockSegmentation);
    mockCustomizationService.getCustomization.mockReturnValue(true);

    setupSegmentationDataModifiedHandler(defaultParameters);

    const callback = mockSegmentationService.subscribeDebounced.mock.calls[0][1];
    await callback({ segmentationId: 'test-id' });

    expect(mockCustomizationService.getCustomization).toHaveBeenCalledWith(
      'panelSegmentation.disableUpdateSegmentationStats'
    );
    expect(updateSegmentationStats).not.toHaveBeenCalled();
    expect(mockSegmentationService.addOrUpdateSegmentation).not.toHaveBeenCalled();
  });

  it('should update segmentation stats when conditions are met', async () => {
    const mockSegmentation = {
      segments: {
        1: { segmentIndex: 1 },
        2: { segmentIndex: 2 },
      },
    };

    const mockUpdatedSegmentation = {
      segments: {
        1: { segmentIndex: 1, stats: 'updated' },
        2: { segmentIndex: 2, stats: 'updated' },
      },
    };

    const mockReadableText = { mean: 'Mean' };

    mockSegmentationService.getSegmentation.mockReturnValue(mockSegmentation);
    mockCustomizationService.getCustomization
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(mockReadableText);
    (updateSegmentationStats as jest.Mock).mockResolvedValue(mockUpdatedSegmentation);

    setupSegmentationDataModifiedHandler(defaultParameters);

    const callback = mockSegmentationService.subscribeDebounced.mock.calls[0][1];
    await callback({ segmentationId: 'test-id' });

    expect(updateSegmentationStats).toHaveBeenCalledWith({
      segmentation: mockSegmentation,
      segmentationId: 'test-id',
      readableText: mockReadableText,
    });
    expect(mockSegmentationService.addOrUpdateSegmentation).toHaveBeenCalledWith({
      segmentationId: 'test-id',
      segments: mockUpdatedSegmentation.segments,
    });
  });

  it('should not update segmentation when unsubscribed', async () => {
    const mockSegmentation = {
      segments: {
        1: { segmentIndex: 1 },
      },
    };

    const mockUpdatedSegmentation = {
      segments: {
        1: { segmentIndex: 1, stats: 'updated' },
      },
    };

    mockSegmentationService.getSegmentation.mockReturnValue(mockSegmentation);
    mockCustomizationService.getCustomization.mockReturnValue(false);
    (updateSegmentationStats as jest.Mock).mockResolvedValue(mockUpdatedSegmentation);

    const result = setupSegmentationDataModifiedHandler(defaultParameters);
    result.unsubscribe();

    const callback = mockSegmentationService.subscribeDebounced.mock.calls[0][1];
    await callback({ segmentationId: 'test-id' });

    expect(updateSegmentationStats).toHaveBeenCalled();
    expect(mockSegmentationService.addOrUpdateSegmentation).not.toHaveBeenCalled();
  });

  it('should not update segmentation when updateSegmentationStats returns null', async () => {
    const mockSegmentation = {
      segments: {
        1: { segmentIndex: 1 },
      },
    };

    mockSegmentationService.getSegmentation.mockReturnValue(mockSegmentation);
    mockCustomizationService.getCustomization.mockReturnValue(false);
    (updateSegmentationStats as jest.Mock).mockResolvedValue(null);

    setupSegmentationDataModifiedHandler(defaultParameters);

    const callback = mockSegmentationService.subscribeDebounced.mock.calls[0][1];
    await callback({ segmentationId: 'test-id' });

    expect(updateSegmentationStats).toHaveBeenCalled();
    expect(mockSegmentationService.addOrUpdateSegmentation).not.toHaveBeenCalled();
  });

  it('should run bidirectional command for segments with bidirectional stats', async () => {
    const mockSegmentation = {
      segments: {
        0: { segmentIndex: 0 },
        1: {
          segmentIndex: 1,
          cachedStats: {
            namedStats: {
              bidirectional: { data: 'test' },
            },
          },
        },
        2: { segmentIndex: 2 },
        3: {
          segmentIndex: 3,
          cachedStats: {
            namedStats: {
              bidirectional: { data: 'test2' },
            },
          },
        },
      },
    };

    mockSegmentationService.getSegmentation.mockReturnValue(mockSegmentation);
    mockCustomizationService.getCustomization.mockReturnValue(false);
    (updateSegmentationStats as jest.Mock).mockResolvedValue(null);

    setupSegmentationDataModifiedHandler(defaultParameters);

    const callback = mockSegmentationService.subscribeDebounced.mock.calls[0][1];
    await callback({ segmentationId: 'test-id' });

    expect(mockCommandsManager.runCommand).toHaveBeenCalledTimes(2);
    expect(mockCommandsManager.runCommand).toHaveBeenNthCalledWith(1, 'runSegmentBidirectional', {
      segmentationId: 'test-id',
      segmentIndex: 1,
    });
    expect(mockCommandsManager.runCommand).toHaveBeenNthCalledWith(2, 'runSegmentBidirectional', {
      segmentationId: 'test-id',
      segmentIndex: 3,
    });
  });

  it('should not run bidirectional command for segment index 0', async () => {
    const mockSegmentation = {
      segments: {
        0: {
          segmentIndex: 0,
          cachedStats: {
            namedStats: {
              bidirectional: { data: 'test' },
            },
          },
        },
        1: { segmentIndex: 1 },
      },
    };

    mockSegmentationService.getSegmentation.mockReturnValue(mockSegmentation);
    mockCustomizationService.getCustomization.mockReturnValue(false);
    (updateSegmentationStats as jest.Mock).mockResolvedValue(null);

    setupSegmentationDataModifiedHandler(defaultParameters);

    const callback = mockSegmentationService.subscribeDebounced.mock.calls[0][1];
    await callback({ segmentationId: 'test-id' });

    expect(mockCommandsManager.runCommand).not.toHaveBeenCalled();
  });

  it('should handle segment without cachedStats', async () => {
    const mockSegmentation = {
      segments: {
        1: { segmentIndex: 1 },
        2: {
          segmentIndex: 2,
          cachedStats: undefined,
        },
        3: {
          segmentIndex: 3,
          cachedStats: {
            namedStats: undefined,
          },
        },
        4: {
          segmentIndex: 4,
          cachedStats: {
            namedStats: {
              other: { data: 'test' },
            },
          },
        },
      },
    };

    mockSegmentationService.getSegmentation.mockReturnValue(mockSegmentation);
    mockCustomizationService.getCustomization.mockReturnValue(false);
    (updateSegmentationStats as jest.Mock).mockResolvedValue(null);

    setupSegmentationDataModifiedHandler(defaultParameters);

    const callback = mockSegmentationService.subscribeDebounced.mock.calls[0][1];
    await callback({ segmentationId: 'test-id' });

    expect(mockCommandsManager.runCommand).not.toHaveBeenCalled();
  });
});

describe('setupSegmentationModifiedHandler', () => {
  const mockSegmentationService = {
    EVENTS: {
      SEGMENTATION_MODIFIED: 'SEGMENTATION_MODIFIED',
    },
    subscribe: jest.fn(),
    getSegmentation: jest.fn(),
  };

  const mockUnsubscribe = jest.fn();

  const defaultParameters = {
    segmentationService: mockSegmentationService,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSegmentationService.subscribe.mockReturnValue({
      unsubscribe: mockUnsubscribe,
    });
    (cornerstoneTools.annotation.state.getAllAnnotations as jest.Mock).mockReturnValue([]);
  });

  it('should subscribe to SEGMENTATION_MODIFIED event', () => {
    setupSegmentationModifiedHandler(defaultParameters);

    expect(mockSegmentationService.subscribe).toHaveBeenCalledWith(
      mockSegmentationService.EVENTS.SEGMENTATION_MODIFIED,
      expect.any(Function)
    );
  });

  it('should return unsubscribe function', () => {
    const result = setupSegmentationModifiedHandler(defaultParameters);

    expect(result).toEqual({
      unsubscribe: mockUnsubscribe,
    });
  });

  it('should return early when segmentation is null', async () => {
    mockSegmentationService.getSegmentation.mockReturnValue(null);

    setupSegmentationModifiedHandler(defaultParameters);

    const callback = mockSegmentationService.subscribe.mock.calls[0][1];
    await callback({ segmentationId: 'test-id' });

    expect(cornerstoneTools.annotation.state.getAllAnnotations).not.toHaveBeenCalled();
    expect(cornerstoneTools.annotation.state.removeAnnotation).not.toHaveBeenCalled();
  });

  it('should remove bidirectional annotations for non-existent segments', async () => {
    const mockSegmentation = {
      segments: {
        1: { segmentIndex: 1 },
        3: { segmentIndex: 3 },
      },
    };

    const mockAnnotations = [
      {
        annotationUID: 'annotation-1',
        metadata: {
          toolName: 'SegmentBidirectional',
          segmentationId: 'test-id',
          segmentIndex: 1,
        },
      },
      {
        annotationUID: 'annotation-2',
        metadata: {
          toolName: 'SegmentBidirectional',
          segmentationId: 'test-id',
          segmentIndex: 2,
        },
      },
      {
        annotationUID: 'annotation-3',
        metadata: {
          toolName: 'SegmentBidirectional',
          segmentationId: 'other-id',
          segmentIndex: 2,
        },
      },
      {
        annotationUID: 'annotation-4',
        metadata: {
          toolName: 'OtherTool',
          segmentationId: 'test-id',
          segmentIndex: 2,
        },
      },
    ];

    mockSegmentationService.getSegmentation.mockReturnValue(mockSegmentation);
    (cornerstoneTools.annotation.state.getAllAnnotations as jest.Mock).mockReturnValue(
      mockAnnotations
    );

    setupSegmentationModifiedHandler(defaultParameters);

    const callback = mockSegmentationService.subscribe.mock.calls[0][1];
    await callback({ segmentationId: 'test-id' });

    expect(cornerstoneTools.annotation.state.removeAnnotation).toHaveBeenCalledTimes(1);
    expect(cornerstoneTools.annotation.state.removeAnnotation).toHaveBeenCalledWith('annotation-2');
  });

  it('should not remove annotations for existing segments', async () => {
    const mockSegmentation = {
      segments: {
        1: { segmentIndex: 1 },
        2: { segmentIndex: 2 },
      },
    };

    const mockAnnotations = [
      {
        annotationUID: 'annotation-1',
        metadata: {
          toolName: 'SegmentBidirectional',
          segmentationId: 'test-id',
          segmentIndex: 1,
        },
      },
      {
        annotationUID: 'annotation-2',
        metadata: {
          toolName: 'SegmentBidirectional',
          segmentationId: 'test-id',
          segmentIndex: 2,
        },
      },
    ];

    mockSegmentationService.getSegmentation.mockReturnValue(mockSegmentation);
    (cornerstoneTools.annotation.state.getAllAnnotations as jest.Mock).mockReturnValue(
      mockAnnotations
    );

    setupSegmentationModifiedHandler(defaultParameters);

    const callback = mockSegmentationService.subscribe.mock.calls[0][1];
    await callback({ segmentationId: 'test-id' });

    expect(cornerstoneTools.annotation.state.removeAnnotation).not.toHaveBeenCalled();
  });

  it('should handle empty segments object', async () => {
    const mockSegmentation = {
      segments: {},
    };

    const mockAnnotations = [
      {
        annotationUID: 'annotation-1',
        metadata: {
          toolName: 'SegmentBidirectional',
          segmentationId: 'test-id',
          segmentIndex: 1,
        },
      },
    ];

    mockSegmentationService.getSegmentation.mockReturnValue(mockSegmentation);
    (cornerstoneTools.annotation.state.getAllAnnotations as jest.Mock).mockReturnValue(
      mockAnnotations
    );

    setupSegmentationModifiedHandler(defaultParameters);

    const callback = mockSegmentationService.subscribe.mock.calls[0][1];
    await callback({ segmentationId: 'test-id' });

    expect(cornerstoneTools.annotation.state.removeAnnotation).toHaveBeenCalledWith('annotation-1');
  });

  it('should filter out segment index 0', async () => {
    const mockSegmentation = {
      segments: {
        0: { segmentIndex: 0 },
        1: { segmentIndex: 1 },
      },
    };

    const mockAnnotations = [
      {
        annotationUID: 'annotation-0',
        metadata: {
          toolName: 'SegmentBidirectional',
          segmentationId: 'test-id',
          segmentIndex: 0,
        },
      },
      {
        annotationUID: 'annotation-1',
        metadata: {
          toolName: 'SegmentBidirectional',
          segmentationId: 'test-id',
          segmentIndex: 1,
        },
      },
    ];

    mockSegmentationService.getSegmentation.mockReturnValue(mockSegmentation);
    (cornerstoneTools.annotation.state.getAllAnnotations as jest.Mock).mockReturnValue(
      mockAnnotations
    );

    setupSegmentationModifiedHandler(defaultParameters);

    const callback = mockSegmentationService.subscribe.mock.calls[0][1];
    await callback({ segmentationId: 'test-id' });

    expect(cornerstoneTools.annotation.state.removeAnnotation).toHaveBeenCalledWith('annotation-0');
  });

  it('should handle no bidirectional annotations', async () => {
    const mockSegmentation = {
      segments: {
        1: { segmentIndex: 1 },
      },
    };

    const mockAnnotations = [
      {
        annotationUID: 'annotation-1',
        metadata: {
          toolName: 'OtherTool',
          segmentationId: 'test-id',
          segmentIndex: 1,
        },
      },
    ];

    mockSegmentationService.getSegmentation.mockReturnValue(mockSegmentation);
    (cornerstoneTools.annotation.state.getAllAnnotations as jest.Mock).mockReturnValue(
      mockAnnotations
    );

    setupSegmentationModifiedHandler(defaultParameters);

    const callback = mockSegmentationService.subscribe.mock.calls[0][1];
    await callback({ segmentationId: 'test-id' });

    expect(cornerstoneTools.annotation.state.removeAnnotation).not.toHaveBeenCalled();
  });

  it('should handle mixed annotation types and segmentation IDs', async () => {
    const mockSegmentation = {
      segments: {
        1: { segmentIndex: 1 },
      },
    };

    const mockAnnotations = [
      {
        annotationUID: 'keep-1',
        metadata: {
          toolName: 'SegmentBidirectional',
          segmentationId: 'test-id',
          segmentIndex: 1,
        },
      },
      {
        annotationUID: 'remove-1',
        metadata: {
          toolName: 'SegmentBidirectional',
          segmentationId: 'test-id',
          segmentIndex: 2,
        },
      },
      {
        annotationUID: 'keep-2',
        metadata: {
          toolName: 'SegmentBidirectional',
          segmentationId: 'other-id',
          segmentIndex: 2,
        },
      },
      {
        annotationUID: 'keep-3',
        metadata: {
          toolName: 'OtherTool',
          segmentationId: 'test-id',
          segmentIndex: 2,
        },
      },
    ];

    mockSegmentationService.getSegmentation.mockReturnValue(mockSegmentation);
    (cornerstoneTools.annotation.state.getAllAnnotations as jest.Mock).mockReturnValue(
      mockAnnotations
    );

    setupSegmentationModifiedHandler(defaultParameters);

    const callback = mockSegmentationService.subscribe.mock.calls[0][1];
    await callback({ segmentationId: 'test-id' });

    expect(cornerstoneTools.annotation.state.removeAnnotation).toHaveBeenCalledTimes(1);
    expect(cornerstoneTools.annotation.state.removeAnnotation).toHaveBeenCalledWith('remove-1');
  });
});
