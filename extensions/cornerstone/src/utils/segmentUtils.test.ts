import { handleSegmentChange } from './segmentUtils';

describe('handleSegmentChange', () => {
  const mockSegmentationService = {
    getSegmentation: jest.fn(),
    getActiveSegment: jest.fn(),
    setActiveSegment: jest.fn(),
    jumpToSegmentNext: jest.fn(),
  };

  const mockSegmentation = {
    segments: {
      '1': {
        segmentIndex: 1,
        label: 'Segment 1',
      },
      '2': {
        segmentIndex: 2,
        label: 'Segment 2',
      },
      '3': {
        segmentIndex: 3,
        label: 'Segment 3',
      },
    },
  };

  const defaultParameters = {
    direction: 1,
    segmentationId: 'test-segmentation-id',
    viewportId: 'test-viewport-id',
    selectedSegmentObjectIndex: 0,
    // @ts-expect-error - only part of the SegmentationService is needed
    segmentationService: mockSegmentationService as AppTypes.SegmentationService,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSegmentationService.getSegmentation.mockReturnValue(mockSegmentation);
  });

  it('should move to next segment when direction is positive and activeSegment is null', () => {
    const direction = 1;
    mockSegmentationService.getActiveSegment.mockReturnValue(null);

    handleSegmentChange({
      ...defaultParameters,
      direction,
      selectedSegmentObjectIndex: 0,
    });

    expect(mockSegmentationService.getSegmentation).toHaveBeenCalledWith(
      defaultParameters.segmentationId
    );
    expect(mockSegmentationService.getActiveSegment).toHaveBeenCalledWith(
      defaultParameters.viewportId
    );
    expect(mockSegmentationService.setActiveSegment).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      2
    );
    expect(mockSegmentationService.jumpToSegmentNext).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      2,
      defaultParameters.viewportId,
      direction
    );
  });

  it('should move to previous segment when direction is negative and activeSegment is null', () => {
    const direction = -1;
    mockSegmentationService.getActiveSegment.mockReturnValue(null);

    handleSegmentChange({
      ...defaultParameters,
      direction,
      selectedSegmentObjectIndex: 1,
    });

    expect(mockSegmentationService.setActiveSegment).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      1
    );
    expect(mockSegmentationService.jumpToSegmentNext).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      1,
      defaultParameters.viewportId,
      direction
    );
  });

  it('should update selectedSegmentObjectIndex when activeSegment is found', () => {
    const direction = 1;
    const mockActiveSegment = {
      segmentIndex: 2,
    };
    mockSegmentationService.getActiveSegment.mockReturnValue(mockActiveSegment);

    handleSegmentChange({
      ...defaultParameters,
      direction,
      selectedSegmentObjectIndex: 0,
    });

    expect(mockSegmentationService.setActiveSegment).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      3
    );
    expect(mockSegmentationService.jumpToSegmentNext).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      3,
      defaultParameters.viewportId,
      direction
    );
  });

  it('should loop to first segment when going beyond last segment', () => {
    const direction = 1;
    mockSegmentationService.getActiveSegment.mockReturnValue(null);

    handleSegmentChange({
      ...defaultParameters,
      direction,
      selectedSegmentObjectIndex: 2,
    });

    expect(mockSegmentationService.setActiveSegment).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      1
    );
    expect(mockSegmentationService.jumpToSegmentNext).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      1,
      defaultParameters.viewportId,
      direction
    );
  });

  it('should loop to last segment when going before first segment', () => {
    const direction = -1;
    mockSegmentationService.getActiveSegment.mockReturnValue(null);

    handleSegmentChange({
      ...defaultParameters,
      direction,
      selectedSegmentObjectIndex: 0,
    });

    expect(mockSegmentationService.setActiveSegment).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      3
    );
    expect(mockSegmentationService.jumpToSegmentNext).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      3,
      defaultParameters.viewportId,
      direction
    );
  });

  it('should handle direction with value greater than 1', () => {
    const direction = 2;
    mockSegmentationService.getActiveSegment.mockReturnValue(null);

    handleSegmentChange({
      ...defaultParameters,
      direction,
      selectedSegmentObjectIndex: 0,
    });

    expect(mockSegmentationService.setActiveSegment).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      3
    );
    expect(mockSegmentationService.jumpToSegmentNext).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      3,
      defaultParameters.viewportId,
      direction
    );
  });

  it('should handle direction with value less than -1', () => {
    const direction = -2;
    mockSegmentationService.getActiveSegment.mockReturnValue(null);

    handleSegmentChange({
      ...defaultParameters,
      direction,
      selectedSegmentObjectIndex: 1,
    });

    expect(mockSegmentationService.setActiveSegment).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      3
    );
    expect(mockSegmentationService.jumpToSegmentNext).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      3,
      defaultParameters.viewportId,
      direction
    );
  });

  it('should handle single segment scenario with positive direction', () => {
    const direction = 1;
    const singleSegmentSegmentation = {
      segments: {
        '1': {
          segmentIndex: 1,
          label: 'Only Segment',
        },
      },
    };

    mockSegmentationService.getSegmentation.mockReturnValue(singleSegmentSegmentation);
    mockSegmentationService.getActiveSegment.mockReturnValue(null);

    handleSegmentChange({
      ...defaultParameters,
      direction,
      selectedSegmentObjectIndex: 0,
    });

    expect(mockSegmentationService.setActiveSegment).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      1
    );
    expect(mockSegmentationService.jumpToSegmentNext).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      1,
      defaultParameters.viewportId,
      direction
    );
  });

  it('should handle single segment scenario with negative direction', () => {
    const direction = -1;
    const singleSegmentSegmentation = {
      segments: {
        '1': {
          segmentIndex: 1,
          label: 'Only Segment',
        },
      },
    };

    mockSegmentationService.getSegmentation.mockReturnValue(singleSegmentSegmentation);
    mockSegmentationService.getActiveSegment.mockReturnValue(null);

    handleSegmentChange({
      ...defaultParameters,
      direction,
      selectedSegmentObjectIndex: 0,
    });

    expect(mockSegmentationService.setActiveSegment).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      1
    );
    expect(mockSegmentationService.jumpToSegmentNext).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      1,
      defaultParameters.viewportId,
      direction
    );
  });

  it('should handle activeSegment not found in segments', () => {
    const direction = 1;
    const mockActiveSegment = {
      segmentIndex: 99,
    };
    mockSegmentationService.getActiveSegment.mockReturnValue(mockActiveSegment);

    handleSegmentChange({
      ...defaultParameters,
      direction,
      selectedSegmentObjectIndex: 0,
    });

    expect(mockSegmentationService.setActiveSegment).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      1
    );
    expect(mockSegmentationService.jumpToSegmentNext).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      1,
      defaultParameters.viewportId,
      direction
    );
  });

  it('should handle zero direction', () => {
    const direction = 0;
    mockSegmentationService.getActiveSegment.mockReturnValue(null);

    handleSegmentChange({
      ...defaultParameters,
      direction,
      selectedSegmentObjectIndex: 1,
    });

    expect(mockSegmentationService.setActiveSegment).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      2
    );
    expect(mockSegmentationService.jumpToSegmentNext).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      2,
      defaultParameters.viewportId,
      direction
    );
  });

  it('should handle segments with non-sequential indices', () => {
    const direction = 1;
    const nonSequentialSegmentation = {
      segments: {
        '5': {
          segmentIndex: 5,
          label: 'Segment 5',
        },
        '10': {
          segmentIndex: 10,
          label: 'Segment 10',
        },
        '15': {
          segmentIndex: 15,
          label: 'Segment 15',
        },
      },
    };

    mockSegmentationService.getSegmentation.mockReturnValue(nonSequentialSegmentation);
    mockSegmentationService.getActiveSegment.mockReturnValue(null);

    handleSegmentChange({
      ...defaultParameters,
      direction,
      selectedSegmentObjectIndex: 0,
    });

    expect(mockSegmentationService.setActiveSegment).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      10
    );
    expect(mockSegmentationService.jumpToSegmentNext).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      10,
      defaultParameters.viewportId,
      direction
    );
  });

  it('should handle wrap around with non-sequential indices', () => {
    const direction = 1;
    const nonSequentialSegmentation = {
      segments: {
        '5': {
          segmentIndex: 5,
          label: 'Segment 5',
        },
        '10': {
          segmentIndex: 10,
          label: 'Segment 10',
        },
      },
    };

    mockSegmentationService.getSegmentation.mockReturnValue(nonSequentialSegmentation);
    mockSegmentationService.getActiveSegment.mockReturnValue(null);

    handleSegmentChange({
      ...defaultParameters,
      direction,
      selectedSegmentObjectIndex: 1,
    });

    expect(mockSegmentationService.setActiveSegment).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      5
    );
    expect(mockSegmentationService.jumpToSegmentNext).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      5,
      defaultParameters.viewportId,
      direction
    );
  });

  it('should handle empty segments object', () => {
    const direction = 1;
    const emptySegmentation = {
      segments: {},
    };

    mockSegmentationService.getSegmentation.mockReturnValue(emptySegmentation);
    mockSegmentationService.getActiveSegment.mockReturnValue(null);

    handleSegmentChange({
      ...defaultParameters,
      direction,
      selectedSegmentObjectIndex: 0,
    });

    expect(mockSegmentationService.setActiveSegment).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      undefined
    );
    expect(mockSegmentationService.jumpToSegmentNext).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      undefined,
      defaultParameters.viewportId,
      direction
    );
  });

  it('should handle large positive direction that wraps multiple times', () => {
    const direction = 5;
    mockSegmentationService.getActiveSegment.mockReturnValue(null);

    handleSegmentChange({
      ...defaultParameters,
      direction,
      selectedSegmentObjectIndex: 1,
    });

    expect(mockSegmentationService.setActiveSegment).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      1
    );
    expect(mockSegmentationService.jumpToSegmentNext).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      1,
      defaultParameters.viewportId,
      direction
    );
  });

  it('should handle large negative direction that wraps multiple times', () => {
    const direction = -5;
    mockSegmentationService.getActiveSegment.mockReturnValue(null);

    handleSegmentChange({
      ...defaultParameters,
      direction,
      selectedSegmentObjectIndex: 1,
    });

    expect(mockSegmentationService.setActiveSegment).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      3
    );
    expect(mockSegmentationService.jumpToSegmentNext).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      3,
      defaultParameters.viewportId,
      direction
    );
  });

  it('should handle activeSegment with segmentIndex 0', () => {
    const direction = 1;
    const mockActiveSegment = {
      segmentIndex: 0,
    };
    mockSegmentationService.getActiveSegment.mockReturnValue(mockActiveSegment);

    handleSegmentChange({
      ...defaultParameters,
      direction,
      selectedSegmentObjectIndex: 0,
    });

    expect(mockSegmentationService.setActiveSegment).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      1
    );
    expect(mockSegmentationService.jumpToSegmentNext).toHaveBeenCalledWith(
      defaultParameters.segmentationId,
      1,
      defaultParameters.viewportId,
      direction
    );
  });

  it('should use different viewport and segmentation IDs', () => {
    const direction = 1;
    mockSegmentationService.getActiveSegment.mockReturnValue(null);

    handleSegmentChange({
      ...defaultParameters,
      segmentationId: 'different-segmentation-id',
      viewportId: 'different-viewport-id',
      direction,
      selectedSegmentObjectIndex: 0,
    });

    expect(mockSegmentationService.getSegmentation).toHaveBeenCalledWith(
      'different-segmentation-id'
    );
    expect(mockSegmentationService.getActiveSegment).toHaveBeenCalledWith('different-viewport-id');
    expect(mockSegmentationService.setActiveSegment).toHaveBeenCalledWith(
      'different-segmentation-id',
      2
    );
    expect(mockSegmentationService.jumpToSegmentNext).toHaveBeenCalledWith(
      'different-segmentation-id',
      2,
      'different-viewport-id',
      direction
    );
  });
});
