import promptHydrationDialog, { HydrationType } from './promptHydrationDialog';

describe('promptHydrationDialog', () => {
  const mockUIViewportDialogService = {
    show: jest.fn(),
    hide: jest.fn(),
  };

  const mockCustomizationService = {
    getCustomization: jest.fn(),
  };

  const mockExtensionManager = {
    _appConfig: {
      measurementTrackingMode: 'standard',
      disableConfirmationPrompts: false,
    },
  };

  const mockServicesManager = {
    services: {
      uiViewportDialogService: mockUIViewportDialogService,
      customizationService: mockCustomizationService,
    },
    _extensionManager: mockExtensionManager,
  };

  const mockDisplaySet = {
    displaySetInstanceUID: 'test-display-set-uid',
    SeriesInstanceUID: 'test-series-uid',
  };

  const mockHydrateCallback = jest.fn();
  const mockPreHydrateCallback = jest.fn();

  const defaultParameters = {
    servicesManager: mockServicesManager as unknown as AppTypes.ServicesManager,
    viewportId: 'test-viewport-id',
    displaySet: mockDisplaySet as unknown as AppTypes.DisplaySet,
    preHydrateCallbacks: [mockPreHydrateCallback],
    hydrateCallback: mockHydrateCallback,
    type: HydrationType.SEG,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCustomizationService.getCustomization.mockReturnValue('Test message');
    mockHydrateCallback.mockResolvedValue(true);
    jest.spyOn(window, 'setTimeout').mockImplementation((callback: () => void) => {
      callback();
      return 0 as unknown as NodeJS.Timeout;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return HYDRATE response when disableConfirmationPrompts is true for non-SR types', async () => {
    mockExtensionManager._appConfig.disableConfirmationPrompts = true;

    const result = await promptHydrationDialog(defaultParameters);

    expect(mockUIViewportDialogService.show).not.toHaveBeenCalled();
    expect(mockPreHydrateCallback).toHaveBeenCalled();
    expect(mockHydrateCallback).toHaveBeenCalledWith({
      segDisplaySet: mockDisplaySet,
      viewportId: defaultParameters.viewportId,
    });
    expect(result).toBe(true);
  });

  it('should show dialog when disableConfirmationPrompts is false for non-SR types', async () => {
    mockExtensionManager._appConfig.disableConfirmationPrompts = false;

    const promise = promptHydrationDialog(defaultParameters);

    expect(mockUIViewportDialogService.show).toHaveBeenCalledWith({
      id: 'promptHydrateSEG',
      viewportId: defaultParameters.viewportId,
      type: 'info',
      message: 'Test message',
      actions: [
        {
          id: 'no-hydrate',
          type: 'secondary',
          text: 'No',
          value: 0,
        },
        {
          id: 'yes-hydrate',
          type: 'primary',
          text: 'Yes',
          value: 5,
        },
      ],
      onSubmit: expect.any(Function),
      onOutsideClick: expect.any(Function),
      onKeyPress: expect.any(Function),
    });

    const onSubmit = mockUIViewportDialogService.show.mock.calls[0][0].onSubmit;
    onSubmit(5);

    const result = await promise;
    expect(result).toBe(true);
  });

  it('should handle CANCEL response', async () => {
    mockExtensionManager._appConfig.disableConfirmationPrompts = false;

    const promise = promptHydrationDialog(defaultParameters);

    const onSubmit = mockUIViewportDialogService.show.mock.calls[0][0].onSubmit;
    onSubmit(0);

    const result = await promise;
    expect(result).toBe(false);
    expect(mockHydrateCallback).not.toHaveBeenCalled();
  });

  it('should handle onOutsideClick', async () => {
    mockExtensionManager._appConfig.disableConfirmationPrompts = false;

    const promise = promptHydrationDialog(defaultParameters);

    const onOutsideClick = mockUIViewportDialogService.show.mock.calls[0][0].onOutsideClick;
    onOutsideClick();

    const result = await promise;
    expect(result).toBe(false);
    expect(mockUIViewportDialogService.hide).toHaveBeenCalled();
  });

  it('should handle onKeyPress Enter', async () => {
    mockExtensionManager._appConfig.disableConfirmationPrompts = false;

    const promise = promptHydrationDialog(defaultParameters);

    const onKeyPress = mockUIViewportDialogService.show.mock.calls[0][0].onKeyPress;
    onKeyPress({ key: 'Enter' });

    const result = await promise;
    expect(result).toBe(true);
    expect(mockUIViewportDialogService.hide).toHaveBeenCalled();
  });

  it('should handle onKeyPress non-Enter key', async () => {
    mockExtensionManager._appConfig.disableConfirmationPrompts = false;

    const promise = promptHydrationDialog(defaultParameters);

    const onKeyPress = mockUIViewportDialogService.show.mock.calls[0][0].onKeyPress;
    onKeyPress({ key: 'Escape' });

    expect(mockUIViewportDialogService.hide).not.toHaveBeenCalled();

    const onOutsideClick = mockUIViewportDialogService.show.mock.calls[0][0].onOutsideClick;
    onOutsideClick();

    const result = await promise;
    expect(result).toBe(false);
  });

  it('should handle SEG type hydration with setTimeout', async () => {
    mockExtensionManager._appConfig.disableConfirmationPrompts = true;

    await promptHydrationDialog({
      ...defaultParameters,
      type: HydrationType.SEG,
    });

    expect(window.setTimeout).toHaveBeenCalledWith(expect.any(Function), 0);
    expect(mockHydrateCallback).toHaveBeenCalledWith({
      segDisplaySet: mockDisplaySet,
      viewportId: defaultParameters.viewportId,
    });
  });

  it('should handle RTSTRUCT type hydration', async () => {
    mockExtensionManager._appConfig.disableConfirmationPrompts = true;

    const result = await promptHydrationDialog({
      ...defaultParameters,
      type: HydrationType.RTSTRUCT,
    });

    expect(mockHydrateCallback).toHaveBeenCalledWith({
      rtDisplaySet: mockDisplaySet,
      viewportId: defaultParameters.viewportId,
      servicesManager: mockServicesManager,
    });
    expect(result).toBe(true);
  });

  it('should handle SR type hydration when standardMode is true', async () => {
    mockExtensionManager._appConfig.measurementTrackingMode = 'standard';
    const mockHydrationResult = {
      StudyInstanceUID: 'test-study-uid',
      SeriesInstanceUIDs: ['series-1', 'series-2'],
    };
    mockHydrateCallback.mockResolvedValue(mockHydrationResult);

    const promise = promptHydrationDialog({
      ...defaultParameters,
      type: HydrationType.SR,
    });

    const onSubmit = mockUIViewportDialogService.show.mock.calls[0][0].onSubmit;
    onSubmit(5);

    const result = await promise;

    expect(result).toEqual({
      userResponse: 5,
      displaySetInstanceUID: mockDisplaySet.displaySetInstanceUID,
      srSeriesInstanceUID: mockDisplaySet.SeriesInstanceUID,
      viewportId: defaultParameters.viewportId,
      StudyInstanceUID: mockHydrationResult.StudyInstanceUID,
      SeriesInstanceUIDs: mockHydrationResult.SeriesInstanceUIDs,
    });
  });

  it('should handle SR type hydration when standardMode is false', async () => {
    mockExtensionManager._appConfig.measurementTrackingMode = 'other';

    const result = await promptHydrationDialog({
      ...defaultParameters,
      type: HydrationType.SR,
    });

    expect(mockUIViewportDialogService.show).not.toHaveBeenCalled();
    expect(result).toEqual({
      userResponse: 5,
      displaySetInstanceUID: mockDisplaySet.displaySetInstanceUID,
      srSeriesInstanceUID: mockDisplaySet.SeriesInstanceUID,
      viewportId: defaultParameters.viewportId,
      StudyInstanceUID: undefined,
      SeriesInstanceUIDs: undefined,
    });
  });

  it('should handle SR type with CANCEL response', async () => {
    mockExtensionManager._appConfig.measurementTrackingMode = 'standard';

    const promise = promptHydrationDialog({
      ...defaultParameters,
      type: HydrationType.SR,
    });

    const onSubmit = mockUIViewportDialogService.show.mock.calls[0][0].onSubmit;
    onSubmit(0);

    const result = await promise;

    expect(result).toEqual({
      userResponse: 0,
      displaySetInstanceUID: mockDisplaySet.displaySetInstanceUID,
      srSeriesInstanceUID: mockDisplaySet.SeriesInstanceUID,
      viewportId: defaultParameters.viewportId,
    });
  });

  it('should handle undefined preHydrateCallbacks', async () => {
    mockExtensionManager._appConfig.disableConfirmationPrompts = true;

    await promptHydrationDialog({
      ...defaultParameters,
      preHydrateCallbacks: undefined,
    });

    expect(mockHydrateCallback).toHaveBeenCalled();
  });

  it('should handle empty preHydrateCallbacks array', async () => {
    mockExtensionManager._appConfig.disableConfirmationPrompts = true;

    await promptHydrationDialog({
      ...defaultParameters,
      preHydrateCallbacks: [],
    });

    expect(mockHydrateCallback).toHaveBeenCalled();
  });

  it('should execute multiple preHydrateCallbacks', async () => {
    const mockPreHydrateCallback2 = jest.fn();
    mockExtensionManager._appConfig.disableConfirmationPrompts = true;

    await promptHydrationDialog({
      ...defaultParameters,
      preHydrateCallbacks: [mockPreHydrateCallback, mockPreHydrateCallback2],
    });

    expect(mockPreHydrateCallback).toHaveBeenCalled();
    expect(mockPreHydrateCallback2).toHaveBeenCalled();
  });

  it('should get correct customization message key for SEG type', async () => {
    mockExtensionManager._appConfig.disableConfirmationPrompts = false;

    const promise = promptHydrationDialog({
      ...defaultParameters,
      type: HydrationType.SEG,
    });

    expect(mockCustomizationService.getCustomization).toHaveBeenCalledWith(
      'viewportNotification.hydrateSEGMessage'
    );

    const onOutsideClick = mockUIViewportDialogService.show.mock.calls[0][0].onOutsideClick;
    onOutsideClick();
    await promise;
  });

  it('should get correct customization message key for RTSTRUCT type', async () => {
    mockExtensionManager._appConfig.disableConfirmationPrompts = false;

    const promise = promptHydrationDialog({
      ...defaultParameters,
      type: HydrationType.RTSTRUCT,
    });

    expect(mockCustomizationService.getCustomization).toHaveBeenCalledWith(
      'viewportNotification.hydrateRTMessage'
    );

    const onOutsideClick = mockUIViewportDialogService.show.mock.calls[0][0].onOutsideClick;
    onOutsideClick();
    await promise;
  });

  it('should get correct customization message key for SR type', async () => {
    mockExtensionManager._appConfig.measurementTrackingMode = 'standard';

    const promise = promptHydrationDialog({
      ...defaultParameters,
      type: HydrationType.SR,
    });

    expect(mockCustomizationService.getCustomization).toHaveBeenCalledWith(
      'viewportNotification.hydrateSRMessage'
    );

    const onOutsideClick = mockUIViewportDialogService.show.mock.calls[0][0].onOutsideClick;
    onOutsideClick();
    await promise;
  });

  it('should get default customization message key for unknown type', async () => {
    mockExtensionManager._appConfig.disableConfirmationPrompts = false;

    const promise = promptHydrationDialog({
      ...defaultParameters,
      type: 'UNKNOWN_TYPE',
    });

    expect(mockCustomizationService.getCustomization).toHaveBeenCalledWith(
      'viewportNotification.hydrateMessage'
    );

    const onOutsideClick = mockUIViewportDialogService.show.mock.calls[0][0].onOutsideClick;
    onOutsideClick();
    await promise;
  });

  it('should get correct dialog id for SEG type', async () => {
    mockExtensionManager._appConfig.disableConfirmationPrompts = false;

    const promise = promptHydrationDialog({
      ...defaultParameters,
      type: HydrationType.SEG,
    });

    expect(mockUIViewportDialogService.show).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'promptHydrateSEG',
      })
    );

    const onOutsideClick = mockUIViewportDialogService.show.mock.calls[0][0].onOutsideClick;
    onOutsideClick();
    await promise;
  });

  it('should get correct dialog id for SR type', async () => {
    mockExtensionManager._appConfig.measurementTrackingMode = 'standard';

    const promise = promptHydrationDialog({
      ...defaultParameters,
      type: HydrationType.SR,
    });

    expect(mockUIViewportDialogService.show).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'promptHydrateSR',
      })
    );

    const onOutsideClick = mockUIViewportDialogService.show.mock.calls[0][0].onOutsideClick;
    onOutsideClick();
    await promise;
  });

  it('should get default dialog id for unknown type', async () => {
    mockExtensionManager._appConfig.disableConfirmationPrompts = false;

    const promise = promptHydrationDialog({
      ...defaultParameters,
      type: 'UNKNOWN_TYPE',
    });

    expect(mockUIViewportDialogService.show).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'promptHydrate',
      })
    );

    const onOutsideClick = mockUIViewportDialogService.show.mock.calls[0][0].onOutsideClick;
    onOutsideClick();
    await promise;
  });

  it('should handle hydrateCallback returning false for SEG', async () => {
    mockExtensionManager._appConfig.disableConfirmationPrompts = true;
    mockHydrateCallback.mockResolvedValue(false);

    const result = await promptHydrationDialog({
      ...defaultParameters,
      type: HydrationType.SEG,
    });

    expect(result).toBe(false);
  });

  it('should handle hydrateCallback returning false for RTSTRUCT', async () => {
    mockExtensionManager._appConfig.disableConfirmationPrompts = true;
    mockHydrateCallback.mockResolvedValue(false);

    const result = await promptHydrationDialog({
      ...defaultParameters,
      type: HydrationType.RTSTRUCT,
    });

    expect(result).toBe(false);
  });

  it('should handle SR hydration with null result', async () => {
    mockExtensionManager._appConfig.measurementTrackingMode = 'standard';
    mockHydrateCallback.mockResolvedValue(null);

    const promise = promptHydrationDialog({
      ...defaultParameters,
      type: HydrationType.SR,
    });

    const onSubmit = mockUIViewportDialogService.show.mock.calls[0][0].onSubmit;
    onSubmit(5);

    const result = await promise;

    expect(result).toEqual({
      userResponse: 5,
      displaySetInstanceUID: mockDisplaySet.displaySetInstanceUID,
      srSeriesInstanceUID: mockDisplaySet.SeriesInstanceUID,
      viewportId: defaultParameters.viewportId,
      StudyInstanceUID: undefined,
      SeriesInstanceUIDs: undefined,
    });
  });

  it('should handle RTSTRUCT type in getDialogId', async () => {
    mockExtensionManager._appConfig.disableConfirmationPrompts = false;

    const promise = promptHydrationDialog({
      ...defaultParameters,
      type: 'RTSTRUCT',
    });

    expect(mockUIViewportDialogService.show).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'promptHydrateRT',
      })
    );

    const onOutsideClick = mockUIViewportDialogService.show.mock.calls[0][0].onOutsideClick;
    onOutsideClick();
    await promise;
  });
});
