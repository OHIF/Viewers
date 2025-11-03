import { getUpdatedViewportsForSegmentation } from './hydrationUtils';

describe('getUpdatedViewportsForSegmentation', () => {
  const mockHangingProtocolService = {
    getViewportsRequireUpdate: jest.fn(),
  };

  const mockViewportGridService = {
    getState: jest.fn(),
  };

  const mockServicesManager = {
    services: {
      hangingProtocolService: mockHangingProtocolService,
      viewportGridService: mockViewportGridService,
    },
  };

  const mockViewport = {
    viewportOptions: {
      viewportId: 'target-viewport-id',
    },
  };

  const mockViewports = new Map([
    ['viewport-1', mockViewport],
    ['active-viewport-id', mockViewport],
  ]);

  const defaultParameters = {
    viewportId: 'viewport-1',
    servicesManager: mockServicesManager as unknown as AppTypes.ServicesManager,
    displaySetInstanceUIDs: ['display-set-1'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockViewportGridService.getState.mockReturnValue({
      isHangingProtocolLayout: true,
      viewports: mockViewports,
      activeViewportId: 'active-viewport-id',
    });
    mockHangingProtocolService.getViewportsRequireUpdate.mockReturnValue([]);
  });

  it('should get updated viewports for segmentation', () => {
    const mockUpdatedViewports = [
      {
        viewportOptions: {
          viewportType: 'stack',
        },
      },
      {
        viewportOptions: {
          viewportType: 'volume',
        },
      },
    ];

    mockHangingProtocolService.getViewportsRequireUpdate.mockReturnValue(mockUpdatedViewports);

    const result = getUpdatedViewportsForSegmentation(defaultParameters);

    expect(mockViewportGridService.getState).toHaveBeenCalled();
    expect(mockHangingProtocolService.getViewportsRequireUpdate).toHaveBeenCalledWith(
      mockViewport.viewportOptions.viewportId,
      defaultParameters.displaySetInstanceUIDs[0],
      true
    );
    expect(result).toEqual(mockUpdatedViewports);
  });

  it('should handle viewports without viewportOptions', () => {
    const mockUpdatedViewports = [
      {
        viewportOptions: {
          viewportType: 'stack',
        },
      },
      {
        someOtherProperty: 'value',
      },
      {
        viewportOptions: null,
      },
    ];

    mockHangingProtocolService.getViewportsRequireUpdate.mockReturnValue(mockUpdatedViewports);

    const result = getUpdatedViewportsForSegmentation(defaultParameters);

    expect(result).toEqual([
      {
        viewportOptions: {
          viewportType: 'stack',
        },
      },
      {
        someOtherProperty: 'value',
      },
      {
        viewportOptions: null,
      },
    ]);
  });

  it('should use activeViewportId when viewportId is not provided', () => {
    const result = getUpdatedViewportsForSegmentation({
      ...defaultParameters,
      viewportId: null,
    });

    expect(mockHangingProtocolService.getViewportsRequireUpdate).toHaveBeenCalledWith(
      mockViewport.viewportOptions.viewportId,
      defaultParameters.displaySetInstanceUIDs[0],
      true
    );
    expect(result).toEqual([]);
  });

  it('should use activeViewportId when viewportId is undefined', () => {
    const result = getUpdatedViewportsForSegmentation({
      ...defaultParameters,
      viewportId: undefined,
    });

    expect(mockHangingProtocolService.getViewportsRequireUpdate).toHaveBeenCalledWith(
      mockViewport.viewportOptions.viewportId,
      defaultParameters.displaySetInstanceUIDs[0],
      true
    );
    expect(result).toEqual([]);
  });

  it('should handle isHangingProtocolLayout false', () => {
    mockViewportGridService.getState.mockReturnValue({
      isHangingProtocolLayout: false,
      viewports: mockViewports,
      activeViewportId: 'active-viewport-id',
    });

    const result = getUpdatedViewportsForSegmentation(defaultParameters);

    expect(mockHangingProtocolService.getViewportsRequireUpdate).toHaveBeenCalledWith(
      mockViewport.viewportOptions.viewportId,
      defaultParameters.displaySetInstanceUIDs[0],
      false
    );
    expect(result).toEqual([]);
  });

  it('should handle multiple displaySetInstanceUIDs by using first one', () => {
    const result = getUpdatedViewportsForSegmentation({
      ...defaultParameters,
      displaySetInstanceUIDs: ['display-set-1', 'display-set-2', 'display-set-3'],
    });

    expect(mockHangingProtocolService.getViewportsRequireUpdate).toHaveBeenCalledWith(
      mockViewport.viewportOptions.viewportId,
      'display-set-1',
      true
    );
    expect(result).toEqual([]);
  });

  it('should handle empty displaySetInstanceUIDs array', () => {
    const result = getUpdatedViewportsForSegmentation({
      ...defaultParameters,
      displaySetInstanceUIDs: [],
    });

    expect(mockHangingProtocolService.getViewportsRequireUpdate).toHaveBeenCalledWith(
      mockViewport.viewportOptions.viewportId,
      undefined,
      true
    );
    expect(result).toEqual([]);
  });

  it('should handle viewport not found in viewports map', () => {
    mockViewportGridService.getState.mockReturnValue({
      isHangingProtocolLayout: true,
      viewports: new Map(),
      activeViewportId: 'non-existent-viewport',
    });

    expect(() => getUpdatedViewportsForSegmentation(defaultParameters)).toThrow();
  });

  it('should handle viewport with missing viewportOptions', () => {
    const viewportWithoutOptions = {};
    const viewportsMap = new Map([['viewport-1', viewportWithoutOptions]]);

    mockViewportGridService.getState.mockReturnValue({
      isHangingProtocolLayout: true,
      viewports: viewportsMap,
      activeViewportId: 'active-viewport-id',
    });

    expect(() => getUpdatedViewportsForSegmentation(defaultParameters)).toThrow();
  });

  it('should handle viewport with null viewportOptions', () => {
    const viewportWithNullOptions = {
      viewportOptions: null,
    };
    const viewportsMap = new Map([['viewport-1', viewportWithNullOptions]]);

    mockViewportGridService.getState.mockReturnValue({
      isHangingProtocolLayout: true,
      viewports: viewportsMap,
      activeViewportId: 'active-viewport-id',
    });

    expect(() => getUpdatedViewportsForSegmentation(defaultParameters)).toThrow();
  });

  it('should handle getViewportsRequireUpdate returning null', () => {
    mockHangingProtocolService.getViewportsRequireUpdate.mockReturnValue(null);

    expect(getUpdatedViewportsForSegmentation(defaultParameters)).toEqual(null);
  });

  it('should handle mixed viewport types including volume3d', () => {
    const mockUpdatedViewports = [
      { viewportOptions: { viewportType: 'stack' } },
      { viewportOptions: { viewportType: 'volume3d' } },
      { viewportOptions: { viewportType: 'volume3d' } },
      { viewportOptions: { viewportType: 'orthogonal' } },
    ];

    mockHangingProtocolService.getViewportsRequireUpdate.mockReturnValue(mockUpdatedViewports);

    const result = getUpdatedViewportsForSegmentation(defaultParameters);

    expect(result).toEqual(mockUpdatedViewports);
  });

  it('should handle viewports with undefined viewportType', () => {
    const mockUpdatedViewports = [
      {
        viewportOptions: {
          viewportType: undefined,
        },
      },
      {
        viewportOptions: {
          viewportType: 'volume3d',
        },
      },
      {
        viewportOptions: {
          someOtherProperty: 'value',
        },
      },
    ];

    mockHangingProtocolService.getViewportsRequireUpdate.mockReturnValue(mockUpdatedViewports);

    const result = getUpdatedViewportsForSegmentation(defaultParameters);

    expect(result).toEqual(mockUpdatedViewports);
  });

  it('should handle complex viewport structure', () => {
    const complexViewport = {
      viewportOptions: {
        viewportId: 'complex-viewport-id',
        viewportType: 'stack',
        orientation: 'axial',
        initialImageOptions: {
          index: 0,
        },
      },
      displaySetOptions: {
        displaySetInstanceUID: 'display-set-1',
      },
    };

    const viewportsMap = new Map([['viewport-1', complexViewport]]);

    mockViewportGridService.getState.mockReturnValue({
      isHangingProtocolLayout: true,
      viewports: viewportsMap,
      activeViewportId: 'active-viewport-id',
    });

    const mockUpdatedViewports = [
      {
        viewportOptions: {
          viewportType: 'stack',
        },
      },
    ];

    mockHangingProtocolService.getViewportsRequireUpdate.mockReturnValue(mockUpdatedViewports);

    const result = getUpdatedViewportsForSegmentation(defaultParameters);

    expect(mockHangingProtocolService.getViewportsRequireUpdate).toHaveBeenCalledWith(
      'complex-viewport-id',
      defaultParameters.displaySetInstanceUIDs[0],
      true
    );
    expect(result).toEqual(mockUpdatedViewports);
  });
});
