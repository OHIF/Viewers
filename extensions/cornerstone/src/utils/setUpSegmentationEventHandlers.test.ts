import { setUpSegmentationEventHandlers } from './setUpSegmentationEventHandlers';
import {
  setupSegmentationDataModifiedHandler,
  setupSegmentationModifiedHandler,
} from './segmentationHandlers';

jest.mock('./segmentationHandlers', () => ({
  setupSegmentationDataModifiedHandler: jest.fn(),
  setupSegmentationModifiedHandler: jest.fn(),
}));

describe('setUpSegmentationEventHandlers', () => {
  const mockSegmentationService = {
    EVENTS: {
      SEGMENTATION_ADDED: 'SEGMENTATION_ADDED',
    },
    subscribe: jest.fn(),
    getSegmentation: jest.fn(),
  };

  const mockCustomizationService = {};

  const mockDisplaySetService = {
    getDisplaySetByUID: jest.fn(),
    addDisplaySets: jest.fn(),
  };

  const mockCommandsManager = {};

  const mockServicesManager = {
    services: {
      segmentationService: mockSegmentationService,
      customizationService: mockCustomizationService,
      displaySetService: mockDisplaySetService,
    },
  };

  const mockUnsubscribeDataModified = jest.fn();
  const mockUnsubscribeModified = jest.fn();
  const mockUnsubscribeCreated = jest.fn();

  const defaultParameters = {
    servicesManager: mockServicesManager as unknown as AppTypes.ServicesManager,
    commandsManager: mockCommandsManager,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (setupSegmentationDataModifiedHandler as jest.Mock).mockReturnValue({
      unsubscribe: mockUnsubscribeDataModified,
    });
    (setupSegmentationModifiedHandler as jest.Mock).mockReturnValue({
      unsubscribe: mockUnsubscribeModified,
    });
    mockSegmentationService.subscribe.mockReturnValue({
      unsubscribe: mockUnsubscribeCreated,
    });
  });

  it('should setup segmentation data modified handler', () => {
    setUpSegmentationEventHandlers(defaultParameters);

    expect(setupSegmentationDataModifiedHandler).toHaveBeenCalledWith({
      segmentationService: mockSegmentationService,
      customizationService: mockCustomizationService,
      commandsManager: mockCommandsManager,
    });
  });

  it('should setup segmentation modified handler', () => {
    setUpSegmentationEventHandlers(defaultParameters);

    expect(setupSegmentationModifiedHandler).toHaveBeenCalledWith({
      segmentationService: mockSegmentationService,
    });
  });

  it('should subscribe to SEGMENTATION_ADDED event', () => {
    setUpSegmentationEventHandlers(defaultParameters);

    expect(mockSegmentationService.subscribe).toHaveBeenCalledWith(
      mockSegmentationService.EVENTS.SEGMENTATION_ADDED,
      expect.any(Function)
    );
  });

  it('should return unsubscriptions object', () => {
    const result = setUpSegmentationEventHandlers(defaultParameters);

    expect(result).toEqual({
      unsubscriptions: [
        mockUnsubscribeDataModified,
        mockUnsubscribeModified,
        mockUnsubscribeCreated,
      ],
    });
  });

  it('should return early when displaySet already exists for segmentationId', () => {
    const mockDisplaySet = {
      displaySetInstanceUID: 'test-segmentation-id',
    };

    mockDisplaySetService.getDisplaySetByUID.mockReturnValue(mockDisplaySet);

    setUpSegmentationEventHandlers(defaultParameters);

    const callback = mockSegmentationService.subscribe.mock.calls[0][1];
    const evt = { segmentationId: 'test-segmentation-id' };

    callback(evt);

    expect(mockDisplaySetService.getDisplaySetByUID).toHaveBeenCalledWith('test-segmentation-id');
    expect(mockSegmentationService.getSegmentation).not.toHaveBeenCalled();
    expect(mockDisplaySetService.addDisplaySets).not.toHaveBeenCalled();
  });

  it('should create and add display set when segmentation is added and no displaySet exists', () => {
    const mockSegmentation = {
      cachedStats: {
        info: 'Test Segmentation Label',
      },
      representationData: {
        Labelmap: {
          imageIds: ['image-1', 'image-2', 'image-3'],
        },
      },
    };

    mockDisplaySetService.getDisplaySetByUID.mockReturnValue(null);
    mockSegmentationService.getSegmentation.mockReturnValue(mockSegmentation);

    setUpSegmentationEventHandlers(defaultParameters);

    const callback = mockSegmentationService.subscribe.mock.calls[0][1];
    const evt = { segmentationId: 'test-segmentation-id' };

    callback(evt);

    expect(mockDisplaySetService.getDisplaySetByUID).toHaveBeenCalledWith('test-segmentation-id');
    expect(mockSegmentationService.getSegmentation).toHaveBeenCalledWith('test-segmentation-id');
    expect(mockDisplaySetService.addDisplaySets).toHaveBeenCalledWith({
      displaySetInstanceUID: 'test-segmentation-id',
      SOPClassUID: '1.2.840.10008.5.1.4.1.1.66.4',
      SOPClassHandlerId: '@ohif/extension-cornerstone-dicom-seg.sopClassHandlerModule.dicom-seg',
      SeriesDescription: mockSegmentation.cachedStats.info,
      Modality: 'SEG',
      numImageFrames: mockSegmentation.representationData.Labelmap.imageIds.length,
      imageIds: mockSegmentation.representationData.Labelmap.imageIds,
      isOverlayDisplaySet: true,
      label: mockSegmentation.cachedStats.info,
      madeInClient: true,
      segmentationId: 'test-segmentation-id',
      isDerived: true,
    });
  });

  it('should handle displaySet undefined when segmentation is added', () => {
    const mockSegmentation = {
      cachedStats: {
        info: 'Test Segmentation Label',
      },
      representationData: {
        Labelmap: {
          imageIds: ['image-1', 'image-2'],
        },
      },
    };

    mockDisplaySetService.getDisplaySetByUID.mockReturnValue(undefined);
    mockSegmentationService.getSegmentation.mockReturnValue(mockSegmentation);

    setUpSegmentationEventHandlers(defaultParameters);

    const callback = mockSegmentationService.subscribe.mock.calls[0][1];
    const evt = { segmentationId: 'test-segmentation-id' };

    callback(evt);

    expect(mockSegmentationService.getSegmentation).toHaveBeenCalledWith('test-segmentation-id');
    expect(mockDisplaySetService.addDisplaySets).toHaveBeenCalledWith({
      displaySetInstanceUID: 'test-segmentation-id',
      SOPClassUID: '1.2.840.10008.5.1.4.1.1.66.4',
      SOPClassHandlerId: '@ohif/extension-cornerstone-dicom-seg.sopClassHandlerModule.dicom-seg',
      SeriesDescription: mockSegmentation.cachedStats.info,
      Modality: 'SEG',
      numImageFrames: mockSegmentation.representationData.Labelmap.imageIds.length,
      imageIds: mockSegmentation.representationData.Labelmap.imageIds,
      isOverlayDisplaySet: true,
      label: mockSegmentation.cachedStats.info,
      madeInClient: true,
      segmentationId: 'test-segmentation-id',
      isDerived: true,
    });
  });

  it('should handle empty imageIds array', () => {
    const mockSegmentation = {
      cachedStats: {
        info: 'Empty Segmentation',
      },
      representationData: {
        Labelmap: {
          imageIds: [],
        },
      },
    };

    mockDisplaySetService.getDisplaySetByUID.mockReturnValue(null);
    mockSegmentationService.getSegmentation.mockReturnValue(mockSegmentation);

    setUpSegmentationEventHandlers(defaultParameters);

    const callback = mockSegmentationService.subscribe.mock.calls[0][1];
    const evt = { segmentationId: 'empty-segmentation-id' };

    callback(evt);

    expect(mockDisplaySetService.addDisplaySets).toHaveBeenCalledWith({
      displaySetInstanceUID: 'empty-segmentation-id',
      SOPClassUID: '1.2.840.10008.5.1.4.1.1.66.4',
      SOPClassHandlerId: '@ohif/extension-cornerstone-dicom-seg.sopClassHandlerModule.dicom-seg',
      SeriesDescription: mockSegmentation.cachedStats.info,
      Modality: 'SEG',
      numImageFrames: 0,
      imageIds: [],
      isOverlayDisplaySet: true,
      label: mockSegmentation.cachedStats.info,
      madeInClient: true,
      segmentationId: 'empty-segmentation-id',
      isDerived: true,
    });
  });

  it('should handle different segmentation label values', () => {
    const mockSegmentation = {
      cachedStats: {
        info: 'Custom Label Text',
      },
      representationData: {
        Labelmap: {
          imageIds: ['custom-image-1'],
        },
      },
    };

    mockDisplaySetService.getDisplaySetByUID.mockReturnValue(null);
    mockSegmentationService.getSegmentation.mockReturnValue(mockSegmentation);

    setUpSegmentationEventHandlers(defaultParameters);

    const callback = mockSegmentationService.subscribe.mock.calls[0][1];
    const evt = { segmentationId: 'custom-segmentation-id' };

    callback(evt);

    expect(mockDisplaySetService.addDisplaySets).toHaveBeenCalledWith({
      displaySetInstanceUID: 'custom-segmentation-id',
      SOPClassUID: '1.2.840.10008.5.1.4.1.1.66.4',
      SOPClassHandlerId: '@ohif/extension-cornerstone-dicom-seg.sopClassHandlerModule.dicom-seg',
      SeriesDescription: 'Custom Label Text',
      Modality: 'SEG',
      numImageFrames: 1,
      imageIds: ['custom-image-1'],
      isOverlayDisplaySet: true,
      label: 'Custom Label Text',
      madeInClient: true,
      segmentationId: 'custom-segmentation-id',
      isDerived: true,
    });
  });

  it('should handle multiple segmentation events', () => {
    const mockSegmentation1 = {
      cachedStats: {
        info: 'Segmentation 1',
      },
      representationData: {
        Labelmap: {
          imageIds: ['image-1'],
        },
      },
    };

    const mockSegmentation2 = {
      cachedStats: {
        info: 'Segmentation 2',
      },
      representationData: {
        Labelmap: {
          imageIds: ['image-2', 'image-3'],
        },
      },
    };

    mockDisplaySetService.getDisplaySetByUID.mockReturnValue(null);
    mockSegmentationService.getSegmentation
      .mockReturnValueOnce(mockSegmentation1)
      .mockReturnValueOnce(mockSegmentation2);

    setUpSegmentationEventHandlers(defaultParameters);

    const callback = mockSegmentationService.subscribe.mock.calls[0][1];

    callback({ segmentationId: 'segmentation-1' });
    callback({ segmentationId: 'segmentation-2' });

    expect(mockDisplaySetService.addDisplaySets).toHaveBeenCalledTimes(2);
    expect(mockDisplaySetService.addDisplaySets).toHaveBeenNthCalledWith(1, {
      displaySetInstanceUID: 'segmentation-1',
      SOPClassUID: '1.2.840.10008.5.1.4.1.1.66.4',
      SOPClassHandlerId: '@ohif/extension-cornerstone-dicom-seg.sopClassHandlerModule.dicom-seg',
      SeriesDescription: mockSegmentation1.cachedStats.info,
      Modality: 'SEG',
      numImageFrames: 1,
      imageIds: mockSegmentation1.representationData.Labelmap.imageIds,
      isOverlayDisplaySet: true,
      label: mockSegmentation1.cachedStats.info,
      madeInClient: true,
      segmentationId: 'segmentation-1',
      isDerived: true,
    });
    expect(mockDisplaySetService.addDisplaySets).toHaveBeenNthCalledWith(2, {
      displaySetInstanceUID: 'segmentation-2',
      SOPClassUID: '1.2.840.10008.5.1.4.1.1.66.4',
      SOPClassHandlerId: '@ohif/extension-cornerstone-dicom-seg.sopClassHandlerModule.dicom-seg',
      SeriesDescription: mockSegmentation2.cachedStats.info,
      Modality: 'SEG',
      numImageFrames: 2,
      imageIds: mockSegmentation2.representationData.Labelmap.imageIds,
      isOverlayDisplaySet: true,
      label: mockSegmentation2.cachedStats.info,
      madeInClient: true,
      segmentationId: 'segmentation-2',
      isDerived: true,
    });
  });

  it('should call all unsubscribe functions in returned unsubscriptions array', () => {
    const result = setUpSegmentationEventHandlers(defaultParameters);

    result.unsubscriptions.forEach(unsubscribe => unsubscribe());

    expect(mockUnsubscribeDataModified).toHaveBeenCalled();
    expect(mockUnsubscribeModified).toHaveBeenCalled();
    expect(mockUnsubscribeCreated).toHaveBeenCalled();
  });
});
