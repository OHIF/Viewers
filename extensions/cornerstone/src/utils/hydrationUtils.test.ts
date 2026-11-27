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

  // Hydration is a statement about the display set, not about a viewport, so a
  // missing or half-built target viewport must not throw. It also must not be
  // matched against the hanging protocol - there is no viewport id to match
  // with - so these fall through to frame-of-reference matching, which finds
  // nothing here because no derived display set was supplied.
  it('should not throw when the target viewport is not in the viewports map', () => {
    mockViewportGridService.getState.mockReturnValue({
      isHangingProtocolLayout: true,
      viewports: new Map(),
      activeViewportId: 'non-existent-viewport',
    });

    expect(getUpdatedViewportsForSegmentation(defaultParameters)).toEqual(null);
    expect(mockHangingProtocolService.getViewportsRequireUpdate).not.toHaveBeenCalled();
  });

  it('should not throw when the target viewport has no viewportOptions', () => {
    const viewportWithoutOptions = {};
    const viewportsMap = new Map([['viewport-1', viewportWithoutOptions]]);

    mockViewportGridService.getState.mockReturnValue({
      isHangingProtocolLayout: true,
      viewports: viewportsMap,
      activeViewportId: 'active-viewport-id',
    });

    expect(getUpdatedViewportsForSegmentation(defaultParameters)).toEqual(null);
  });

  it('should not throw when the target viewport has null viewportOptions', () => {
    const viewportWithNullOptions = {
      viewportOptions: null,
    };
    const viewportsMap = new Map([['viewport-1', viewportWithNullOptions]]);

    mockViewportGridService.getState.mockReturnValue({
      isHangingProtocolLayout: true,
      viewports: viewportsMap,
      activeViewportId: 'active-viewport-id',
    });

    expect(getUpdatedViewportsForSegmentation(defaultParameters)).toEqual(null);
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

  it('should merge all grid viewports that reference the volume after hydration (e.g. 3D four-up)', () => {
    const volumeUid = 'volume-1';
    const viewports = new Map([
      [
        'vp-axial',
        {
          viewportId: 'vp-axial',
          viewportOptions: { viewportId: 'vp-axial' },
          displaySetInstanceUIDs: [volumeUid],
        },
      ],
      [
        'vp-sagittal',
        {
          viewportId: 'vp-sagittal',
          viewportOptions: { viewportId: 'vp-sagittal' },
          displaySetInstanceUIDs: [volumeUid],
        },
      ],
      [
        'vp-other-study',
        {
          viewportId: 'vp-other-study',
          viewportOptions: { viewportId: 'vp-other-study' },
          displaySetInstanceUIDs: ['other-volume'],
        },
      ],
    ]);

    mockViewportGridService.getState.mockReturnValue({
      isHangingProtocolLayout: true,
      viewports,
      activeViewportId: 'vp-axial',
    });

    mockHangingProtocolService.getViewportsRequireUpdate.mockReturnValue([
      { viewportId: 'vp-axial', displaySetInstanceUIDs: [volumeUid] },
    ]);

    const result = getUpdatedViewportsForSegmentation({
      viewportId: 'vp-axial',
      servicesManager: mockServicesManager as unknown as AppTypes.ServicesManager,
      displaySetInstanceUIDs: [volumeUid],
    });

    expect(result).toEqual([
      { viewportId: 'vp-axial', displaySetInstanceUIDs: [volumeUid] },
      { viewportId: 'vp-sagittal', displaySetInstanceUIDs: [volumeUid] },
    ]);
  });

  describe('eligibility matching', () => {
    const displaySets = {
      'volume-1': {
        displaySetInstanceUID: 'volume-1',
        FrameOfReferenceUID: 'for-1',
        isReconstructable: true,
      },
      // A different series co-registered into the same frame of reference. A
      // segmentation over a reconstructable volume is defined in that frame's
      // world coordinates, so it is legitimate to draw it here too.
      'volume-2': {
        displaySetInstanceUID: 'volume-2',
        FrameOfReferenceUID: 'for-1',
        isReconstructable: true,
      },
      'other-volume': {
        displaySetInstanceUID: 'other-volume',
        FrameOfReferenceUID: 'for-2',
        isReconstructable: true,
      },
      // Two unrelated non-reconstructable series that happen to share a frame
      // of reference, which is common. Stack data is bound to specific images,
      // so sharing the frame buys nothing here.
      'stack-1': {
        displaySetInstanceUID: 'stack-1',
        FrameOfReferenceUID: 'for-s',
        isReconstructable: false,
      },
      'stack-2': {
        displaySetInstanceUID: 'stack-2',
        FrameOfReferenceUID: 'for-s',
        isReconstructable: false,
      },
      // A derived display set copies isReconstructable and FrameOfReferenceUID
      // from the display set it references.
      'seg-1': {
        displaySetInstanceUID: 'seg-1',
        Modality: 'SEG',
        FrameOfReferenceUID: 'for-1',
        isReconstructable: true,
        referencedDisplaySetInstanceUID: 'volume-1',
      },
      'rt-1': {
        displaySetInstanceUID: 'rt-1',
        Modality: 'RTSTRUCT',
        FrameOfReferenceUID: 'for-s',
        isReconstructable: false,
        referencedDisplaySetInstanceUID: 'stack-1',
      },
    };

    const makeServices = (allowedViewportTypes = null) =>
      ({
        services: {
          hangingProtocolService: mockHangingProtocolService,
          viewportGridService: mockViewportGridService,
          displaySetService: {
            getDisplaySetByUID: (uid: string) => displaySets[uid],
          },
          customizationService: {
            getCustomization: jest.fn().mockReturnValue(allowedViewportTypes),
          },
        },
      }) as unknown as AppTypes.ServicesManager;

    // The grid records OHIF viewport types ('stack' | 'volume' | 'volume3d'),
    // which is the vocabulary the autoHydrateViewportTypes customization is
    // written in.
    const makeViewport = (viewportId: string, uids: string[], viewportType = 'volume') => [
      viewportId,
      {
        viewportId,
        viewportOptions: { viewportId, viewportType },
        displaySetInstanceUIDs: uids,
      },
    ];

    const setViewports = (entries, activeViewportId) => {
      mockViewportGridService.getState.mockReturnValue({
        isHangingProtocolLayout: true,
        viewports: new Map(entries as never),
        activeViewportId,
      });
    };

    it('should include co-registered volumes in the same frame of reference', () => {
      setViewports(
        [
          makeViewport('vp-axial', ['volume-1']),
          makeViewport('vp-fusion', ['volume-2']),
          makeViewport('vp-other', ['other-volume']),
        ],
        'vp-axial'
      );

      mockHangingProtocolService.getViewportsRequireUpdate.mockReturnValue([
        { viewportId: 'vp-axial', displaySetInstanceUIDs: ['volume-1'] },
      ]);

      const result = getUpdatedViewportsForSegmentation({
        viewportId: 'vp-axial',
        servicesManager: makeServices(),
        displaySetInstanceUIDs: ['volume-1'],
        derivedDisplaySetInstanceUID: 'seg-1',
      });

      // vp-other is a different frame of reference, so it is left alone. The
      // co-registered pane keeps its own display set rather than having the
      // referenced volume forced onto it.
      expect(result).toEqual([
        { viewportId: 'vp-axial', displaySetInstanceUIDs: ['volume-1'] },
        { viewportId: 'vp-fusion', displaySetInstanceUIDs: ['volume-2'] },
      ]);
    });

    it('should not reach past its own display set when the reference is not reconstructable', () => {
      setViewports(
        [makeViewport('vp-stack-1', ['stack-1']), makeViewport('vp-stack-2', ['stack-2'])],
        'vp-stack-1'
      );

      mockHangingProtocolService.getViewportsRequireUpdate.mockReturnValue([
        { viewportId: 'vp-stack-1', displaySetInstanceUIDs: ['stack-1'] },
      ]);

      const result = getUpdatedViewportsForSegmentation({
        viewportId: 'vp-stack-1',
        servicesManager: makeServices(),
        displaySetInstanceUIDs: ['stack-1'],
        derivedDisplaySetInstanceUID: 'rt-1',
      });

      expect(result).toEqual([{ viewportId: 'vp-stack-1', displaySetInstanceUIDs: ['stack-1'] }]);
    });

    it('should find targets with no viewport to match against', () => {
      setViewports([makeViewport('vp-fusion', ['volume-2'])], 'gone-viewport');

      const result = getUpdatedViewportsForSegmentation({
        viewportId: 'gone-viewport',
        servicesManager: makeServices(),
        displaySetInstanceUIDs: ['volume-1'],
        derivedDisplaySetInstanceUID: 'seg-1',
      });

      expect(mockHangingProtocolService.getViewportsRequireUpdate).not.toHaveBeenCalled();
      expect(result).toEqual([{ viewportId: 'vp-fusion', displaySetInstanceUIDs: ['volume-2'] }]);
    });

    it('should exclude viewport types that automatic hydration is not allowed into', () => {
      setViewports(
        [makeViewport('vp-fusion', ['volume-2']), makeViewport('vp-3d', ['volume-2'], 'volume3d')],
        'gone-viewport'
      );

      const result = getUpdatedViewportsForSegmentation({
        viewportId: 'gone-viewport',
        servicesManager: makeServices(['stack', 'volume']),
        displaySetInstanceUIDs: ['volume-1'],
        derivedDisplaySetInstanceUID: 'seg-1',
      });

      expect(result).toEqual([{ viewportId: 'vp-fusion', displaySetInstanceUIDs: ['volume-2'] }]);
    });

    it('should treat the cornerstone spelling of a viewport type as the OHIF one', () => {
      setViewports(
        [makeViewport('vp-fusion', ['volume-2']), makeViewport('vp-3d', ['volume-2'], 'volume3d')],
        'gone-viewport'
      );

      const result = getUpdatedViewportsForSegmentation({
        viewportId: 'gone-viewport',
        servicesManager: makeServices(['stack', 'orthographic']),
        displaySetInstanceUIDs: ['volume-1'],
        derivedDisplaySetInstanceUID: 'seg-1',
      });

      expect(result).toEqual([{ viewportId: 'vp-fusion', displaySetInstanceUIDs: ['volume-2'] }]);
    });

    it('should keep the hanging protocol instruction for a pane that is also eligible', () => {
      // The hydration target is showing a co-registered volume, so it matches on
      // eligibility too - but the protocol is the one that knows the referenced
      // volume has to be loaded into it.
      setViewports(
        [makeViewport('vp-axial', ['volume-2']), makeViewport('vp-fusion', ['volume-2'])],
        'vp-axial'
      );

      mockHangingProtocolService.getViewportsRequireUpdate.mockReturnValue([
        { viewportId: 'vp-axial', displaySetInstanceUIDs: ['volume-1'] },
      ]);

      const result = getUpdatedViewportsForSegmentation({
        viewportId: 'vp-axial',
        servicesManager: makeServices(),
        displaySetInstanceUIDs: ['volume-1'],
        derivedDisplaySetInstanceUID: 'seg-1',
      });

      expect(result).toEqual([
        { viewportId: 'vp-axial', displaySetInstanceUIDs: ['volume-1'] },
        { viewportId: 'vp-fusion', displaySetInstanceUIDs: ['volume-2'] },
      ]);
    });
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
