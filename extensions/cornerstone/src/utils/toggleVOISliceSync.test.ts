import toggleVOISliceSync from './toggleVOISliceSync';

describe('toggleVOISliceSync', () => {
  const mockSyncGroupService = {
    getSynchronizersForViewport: jest.fn(),
    addViewportToSyncGroup: jest.fn(),
    removeViewportFromSyncGroup: jest.fn(),
  };

  const mockViewportGridService = {
    getState: jest.fn(),
  };

  const mockDisplaySetService = {
    getDisplaySetByUID: jest.fn(),
  };

  const mockCornerstoneViewportService = {
    getCornerstoneViewport: jest.fn(),
  };

  const mockServicesManager = {
    services: {
      syncGroupService: mockSyncGroupService,
      viewportGridService: mockViewportGridService,
      displaySetService: mockDisplaySetService,
      cornerstoneViewportService: mockCornerstoneViewportService,
    },
  };

  const mockViewport = {
    id: 'viewport-1',
    getRenderingEngine: jest.fn(() => ({ id: 'rendering-engine-1' })),
  };

  const mockViewport2 = {
    id: 'viewport-2',
    getRenderingEngine: jest.fn(() => ({ id: 'rendering-engine-2' })),
  };

  const mockGridViewport = {
    viewportOptions: {
      viewportId: 'viewport-1',
    },
    displaySetInstanceUIDs: ['displaySet-1'],
  };

  const mockDisplaySet = {
    Modality: 'CT',
  };

  const defaultParameters = {
    servicesManager: mockServicesManager as unknown as AppTypes.ServicesManager,
    viewports: null,
    syncId: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCornerstoneViewportService.getCornerstoneViewport.mockReturnValue(mockViewport);
    mockDisplaySetService.getDisplaySetByUID.mockReturnValue(mockDisplaySet);
  });

  it('should enable sync when no sync exists for single modality', () => {
    const viewports = {
      CT: [mockGridViewport],
    };

    mockSyncGroupService.getSynchronizersForViewport.mockReturnValue([]);

    toggleVOISliceSync({
      ...defaultParameters,
      viewports,
    });

    expect(mockSyncGroupService.getSynchronizersForViewport).toHaveBeenCalledWith('viewport-1');
    expect(mockSyncGroupService.addViewportToSyncGroup).toHaveBeenCalledWith(
      'viewport-1',
      'rendering-engine-1',
      {
        type: 'voi',
        id: 'VOI_SYNC_CT',
        source: true,
        target: true,
      }
    );
  });

  it('should disable sync when sync already exists', () => {
    const viewports = {
      CT: [mockGridViewport],
    };

    const mockSyncState = {
      id: 'VOI_SYNC_CT',
    };

    mockSyncGroupService.getSynchronizersForViewport.mockReturnValue([mockSyncState]);

    toggleVOISliceSync({
      ...defaultParameters,
      viewports,
    });

    expect(mockSyncGroupService.removeViewportFromSyncGroup).toHaveBeenCalledWith(
      'viewport-1',
      'rendering-engine-1',
      'VOI_SYNC_CT'
    );
    expect(mockSyncGroupService.addViewportToSyncGroup).not.toHaveBeenCalled();
  });

  it('should use custom syncId when provided', () => {
    const viewports = {
      CT: [mockGridViewport],
    };

    mockSyncGroupService.getSynchronizersForViewport.mockReturnValue([]);

    toggleVOISliceSync({
      ...defaultParameters,
      viewports,
      syncId: 'CUSTOM_SYNC_ID',
    });

    expect(mockSyncGroupService.addViewportToSyncGroup).toHaveBeenCalledWith(
      'viewport-1',
      'rendering-engine-1',
      {
        type: 'voi',
        id: 'CUSTOM_SYNC_ID',
        source: true,
        target: true,
      }
    );
  });

  it('should handle multiple viewports in same modality', () => {
    const mockGridViewport2 = {
      viewportOptions: {
        viewportId: 'viewport-2',
      },
      displaySetInstanceUIDs: ['displaySet-2'],
    };

    const viewports = {
      CT: [mockGridViewport, mockGridViewport2],
    };

    mockCornerstoneViewportService.getCornerstoneViewport
      .mockReturnValueOnce(mockViewport)
      .mockReturnValueOnce(mockViewport2);

    mockSyncGroupService.getSynchronizersForViewport.mockReturnValue([]);

    toggleVOISliceSync({
      ...defaultParameters,
      viewports,
    });

    expect(mockSyncGroupService.addViewportToSyncGroup).toHaveBeenCalledTimes(2);
    expect(mockSyncGroupService.addViewportToSyncGroup).toHaveBeenNthCalledWith(
      1,
      'viewport-1',
      'rendering-engine-1',
      {
        type: 'voi',
        id: 'VOI_SYNC_CT',
        source: true,
        target: true,
      }
    );
    expect(mockSyncGroupService.addViewportToSyncGroup).toHaveBeenNthCalledWith(
      2,
      'viewport-2',
      'rendering-engine-2',
      {
        type: 'voi',
        id: 'VOI_SYNC_CT',
        source: true,
        target: true,
      }
    );
  });

  it('should handle multiple modalities separately', () => {
    const mockGridViewportMR = {
      viewportOptions: {
        viewportId: 'viewport-mr',
      },
      displaySetInstanceUIDs: ['displaySet-mr'],
    };

    const mockViewportMR = {
      id: 'viewport-mr',
      getRenderingEngine: jest.fn(() => ({ id: 'rendering-engine-mr' })),
    };

    const viewports = {
      CT: [mockGridViewport],
      MR: [mockGridViewportMR],
    };

    mockCornerstoneViewportService.getCornerstoneViewport
      .mockReturnValueOnce(mockViewport)
      .mockReturnValueOnce(mockViewportMR);

    mockSyncGroupService.getSynchronizersForViewport.mockReturnValue([]);

    toggleVOISliceSync({
      ...defaultParameters,
      viewports,
    });

    expect(mockSyncGroupService.addViewportToSyncGroup).toHaveBeenCalledTimes(2);
    expect(mockSyncGroupService.addViewportToSyncGroup).toHaveBeenNthCalledWith(
      1,
      'viewport-1',
      'rendering-engine-1',
      {
        type: 'voi',
        id: 'VOI_SYNC_CT',
        source: true,
        target: true,
      }
    );
    expect(mockSyncGroupService.addViewportToSyncGroup).toHaveBeenNthCalledWith(
      2,
      'viewport-mr',
      'rendering-engine-mr',
      {
        type: 'voi',
        id: 'VOI_SYNC_MR',
        source: true,
        target: true,
      }
    );
  });

  it('should skip viewport when cornerstone viewport is not found', () => {
    const viewports = {
      CT: [mockGridViewport],
    };

    mockCornerstoneViewportService.getCornerstoneViewport.mockReturnValue(null);
    mockSyncGroupService.getSynchronizersForViewport.mockReturnValue([]);

    toggleVOISliceSync({
      ...defaultParameters,
      viewports,
    });

    expect(mockSyncGroupService.addViewportToSyncGroup).not.toHaveBeenCalled();
  });

  it('should generate viewports from grid service when not provided', () => {
    const mockViewportsMap = new Map([
      [
        'viewport-1',
        {
          ...mockGridViewport,
        },
      ],
    ]);

    const mockState = {
      viewports: mockViewportsMap,
    };

    mockViewportGridService.getState.mockReturnValue(mockState);
    mockSyncGroupService.getSynchronizersForViewport.mockReturnValue([]);

    toggleVOISliceSync({
      ...defaultParameters,
      viewports: null,
    });

    expect(mockViewportGridService.getState).toHaveBeenCalled();
    expect(mockDisplaySetService.getDisplaySetByUID).toHaveBeenCalledWith('displaySet-1');
    expect(mockSyncGroupService.addViewportToSyncGroup).toHaveBeenCalledWith(
      'viewport-1',
      'rendering-engine-1',
      {
        type: 'voi',
        id: 'VOI_SYNC_CT',
        source: true,
        target: true,
      }
    );
  });

  it('should handle sync state with different id not matching', () => {
    const viewports = {
      CT: [mockGridViewport],
    };

    const mockSyncState = {
      id: 'DIFFERENT_SYNC_ID',
    };

    mockSyncGroupService.getSynchronizersForViewport.mockReturnValue([mockSyncState]);

    toggleVOISliceSync({
      ...defaultParameters,
      viewports,
    });

    expect(mockSyncGroupService.addViewportToSyncGroup).toHaveBeenCalledWith(
      'viewport-1',
      'rendering-engine-1',
      {
        type: 'voi',
        id: 'VOI_SYNC_CT',
        source: true,
        target: true,
      }
    );
    expect(mockSyncGroupService.removeViewportFromSyncGroup).not.toHaveBeenCalled();
  });

  it('should handle mixed sync states where some match and some do not', () => {
    const mockGridViewport2 = {
      viewportOptions: {
        viewportId: 'viewport-2',
      },
      displaySetInstanceUIDs: ['displaySet-2'],
    };

    const viewports = {
      CT: [mockGridViewport, mockGridViewport2],
    };

    const mockSyncState = {
      id: 'VOI_SYNC_CT',
    };

    mockSyncGroupService.getSynchronizersForViewport
      .mockReturnValueOnce([mockSyncState])
      .mockReturnValueOnce([]);

    mockCornerstoneViewportService.getCornerstoneViewport
      .mockReturnValueOnce(mockViewport)
      .mockReturnValueOnce(mockViewport2);

    toggleVOISliceSync({
      ...defaultParameters,
      viewports,
    });

    expect(mockSyncGroupService.removeViewportFromSyncGroup).toHaveBeenCalledWith(
      'viewport-1',
      'rendering-engine-1',
      'VOI_SYNC_CT'
    );
    expect(mockSyncGroupService.removeViewportFromSyncGroup).toHaveBeenCalledWith(
      'viewport-2',
      'rendering-engine-2',
      'VOI_SYNC_CT'
    );
  });

  it('should disable sync for multiple viewports when sync exists', () => {
    const mockGridViewport2 = {
      viewportOptions: {
        viewportId: 'viewport-2',
      },
      displaySetInstanceUIDs: ['displaySet-2'],
    };

    const mockViewport2 = {
      id: 'viewport-2',
      getRenderingEngine: jest.fn(() => ({ id: 'rendering-engine-2' })),
    };

    const viewports = {
      CT: [mockGridViewport, mockGridViewport2],
    };

    const mockSyncState = {
      id: 'VOI_SYNC_CT',
    };

    mockCornerstoneViewportService.getCornerstoneViewport
      .mockReturnValueOnce(mockViewport)
      .mockReturnValueOnce(mockViewport2);

    mockSyncGroupService.getSynchronizersForViewport.mockReturnValue([mockSyncState]);

    toggleVOISliceSync({
      ...defaultParameters,
      viewports,
    });

    expect(mockSyncGroupService.removeViewportFromSyncGroup).toHaveBeenCalledTimes(2);
    expect(mockSyncGroupService.removeViewportFromSyncGroup).toHaveBeenNthCalledWith(
      1,
      'viewport-1',
      'rendering-engine-1',
      'VOI_SYNC_CT'
    );
    expect(mockSyncGroupService.removeViewportFromSyncGroup).toHaveBeenNthCalledWith(
      2,
      'viewport-2',
      'rendering-engine-2',
      'VOI_SYNC_CT'
    );
  });

  it('should skip viewport during disable when cornerstone viewport is not found', () => {
    const mockGridViewport2 = {
      viewportOptions: {
        viewportId: 'viewport-2',
      },
      displaySetInstanceUIDs: ['displaySet-2'],
    };

    const viewports = {
      CT: [mockGridViewport, mockGridViewport2],
    };

    const mockSyncState = {
      id: 'VOI_SYNC_CT',
    };

    mockCornerstoneViewportService.getCornerstoneViewport
      .mockReturnValueOnce(mockViewport)
      .mockReturnValueOnce(null);

    mockSyncGroupService.getSynchronizersForViewport.mockReturnValue([mockSyncState]);

    toggleVOISliceSync({
      ...defaultParameters,
      viewports,
    });

    expect(mockSyncGroupService.removeViewportFromSyncGroup).toHaveBeenCalledTimes(1);
    expect(mockSyncGroupService.removeViewportFromSyncGroup).toHaveBeenCalledWith(
      'viewport-1',
      'rendering-engine-1',
      'VOI_SYNC_CT'
    );
  });

  it('should handle empty viewports object', () => {
    const viewports = {};

    toggleVOISliceSync({
      ...defaultParameters,
      viewports,
    });

    expect(mockSyncGroupService.getSynchronizersForViewport).not.toHaveBeenCalled();
    expect(mockSyncGroupService.addViewportToSyncGroup).not.toHaveBeenCalled();
    expect(mockSyncGroupService.removeViewportFromSyncGroup).not.toHaveBeenCalled();
  });

  it('should handle modality with empty viewport array', () => {
    const viewports = {
      CT: [],
    };

    toggleVOISliceSync({
      ...defaultParameters,
      viewports,
    });

    expect(mockSyncGroupService.getSynchronizersForViewport).not.toHaveBeenCalled();
    expect(mockSyncGroupService.addViewportToSyncGroup).not.toHaveBeenCalled();
    expect(mockSyncGroupService.removeViewportFromSyncGroup).not.toHaveBeenCalled();
  });

  it('should handle multiple displaySetInstanceUIDs by using first one', () => {
    const mockGridViewportMultipleDisplaySets = {
      viewportOptions: {
        viewportId: 'viewport-1',
      },
      displaySetInstanceUIDs: ['displaySet-1', 'displaySet-2', 'displaySet-3'],
    };

    mockViewportGridService.getState.mockReturnValue({
      viewports: new Map([['viewport-1', mockGridViewportMultipleDisplaySets]]),
    });
    mockSyncGroupService.getSynchronizersForViewport.mockReturnValue([]);
    mockDisplaySetService.getDisplaySetByUID.mockReturnValue(mockDisplaySet);

    toggleVOISliceSync({
      ...defaultParameters,
    });

    expect(mockDisplaySetService.getDisplaySetByUID).toHaveBeenCalledWith('displaySet-1');
    expect(mockSyncGroupService.addViewportToSyncGroup).toHaveBeenCalledWith(
      'viewport-1',
      'rendering-engine-1',
      {
        type: 'voi',
        id: 'VOI_SYNC_CT',
        source: true,
        target: true,
      }
    );
  });

  it('should group viewports by modality correctly when generating from grid', () => {
    const mockViewportsMap = new Map([
      [
        'viewport-ct-1',
        {
          viewportOptions: {
            viewportId: 'viewport-ct-1',
          },
          displaySetInstanceUIDs: ['displaySet-ct-1'],
        },
      ],
      [
        'viewport-ct-2',
        {
          viewportOptions: {
            viewportId: 'viewport-ct-2',
          },
          displaySetInstanceUIDs: ['displaySet-ct-2'],
        },
      ],
      [
        'viewport-mr-1',
        {
          viewportOptions: {
            viewportId: 'viewport-mr-1',
          },
          displaySetInstanceUIDs: ['displaySet-mr-1'],
        },
      ],
    ]);

    const mockState = {
      viewports: mockViewportsMap,
    };

    const mockDisplaySetCT = { Modality: 'CT' };
    const mockDisplaySetMR = { Modality: 'MR' };
    const mockViewportCT1 = {
      id: 'viewport-ct-1',
      getRenderingEngine: jest.fn(() => ({ id: 'rendering-engine-ct-1' })),
    };
    const mockViewportCT2 = {
      id: 'viewport-ct-2',
      getRenderingEngine: jest.fn(() => ({ id: 'rendering-engine-ct-2' })),
    };
    const mockViewportMR1 = {
      id: 'viewport-mr-1',
      getRenderingEngine: jest.fn(() => ({ id: 'rendering-engine-mr-1' })),
    };

    mockViewportGridService.getState.mockReturnValue(mockState);
    mockDisplaySetService.getDisplaySetByUID
      .mockReturnValueOnce(mockDisplaySetCT)
      .mockReturnValueOnce(mockDisplaySetCT)
      .mockReturnValueOnce(mockDisplaySetMR);

    mockCornerstoneViewportService.getCornerstoneViewport
      .mockReturnValueOnce(mockViewportCT1)
      .mockReturnValueOnce(mockViewportCT2)
      .mockReturnValueOnce(mockViewportMR1);

    mockSyncGroupService.getSynchronizersForViewport.mockReturnValue([]);

    toggleVOISliceSync({
      ...defaultParameters,
      viewports: null,
    });

    expect(mockSyncGroupService.addViewportToSyncGroup).toHaveBeenCalledTimes(3);
    expect(mockSyncGroupService.addViewportToSyncGroup).toHaveBeenNthCalledWith(
      1,
      'viewport-ct-1',
      'rendering-engine-ct-1',
      {
        type: 'voi',
        id: 'VOI_SYNC_CT',
        source: true,
        target: true,
      }
    );
    expect(mockSyncGroupService.addViewportToSyncGroup).toHaveBeenNthCalledWith(
      2,
      'viewport-ct-2',
      'rendering-engine-ct-2',
      {
        type: 'voi',
        id: 'VOI_SYNC_CT',
        source: true,
        target: true,
      }
    );
    expect(mockSyncGroupService.addViewportToSyncGroup).toHaveBeenNthCalledWith(
      3,
      'viewport-mr-1',
      'rendering-engine-mr-1',
      {
        type: 'voi',
        id: 'VOI_SYNC_MR',
        source: true,
        target: true,
      }
    );
  });
});
