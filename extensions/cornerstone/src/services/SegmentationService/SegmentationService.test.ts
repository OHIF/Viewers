import {
  cache,
  Enums as csEnums,
  eventTarget,
  geometryLoader,
  getEnabledElementByViewportId,
  imageLoader,
  Types as csTypes,
  metaData,
} from '@cornerstonejs/core';
import { ViewportType } from '@cornerstonejs/core/enums';

import {
  Enums as csToolsEnums,
  segmentation as cstSegmentation,
  Types as cstTypes,
} from '@cornerstonejs/tools';

import { EasingFunctionEnum, EasingFunctionMap } from '../../utils/transitions';
import * as MapROIContoursToRTStructData from './RTSTRUCT/mapROIContoursToRTStructData';
import SegmentationServiceClass, { SegmentationRepresentation } from './SegmentationService';

jest.mock('@cornerstonejs/core', () => ({
  ...jest.requireActual('@cornerstonejs/core'),
  getEnabledElementByViewportId: jest.fn(),
  eventTarget: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
}));

jest.mock('@cornerstonejs/tools', () => ({
  ...jest.requireActual('@cornerstonejs/tools'),
  segmentation: {
    ...jest.requireActual('@cornerstonejs/tools').segmentation,
    activeSegmentation: {
      getActiveSegmentation: jest.fn(),
      setActiveSegmentation: jest.fn(),
    },
    addSegmentations: jest.fn(),
    config: {
      color: {
        getSegmentIndexColor: jest.fn(),
        setSegmentIndexColor: jest.fn(),
      },
      visibility: {
        getHiddenSegmentIndices: jest.fn(),
        getSegmentIndexVisibility: jest.fn(),
        setSegmentIndexVisibility: jest.fn(),
        setSegmentationRepresentationVisibility: jest.fn(),
      },
      style: {
        hasCustomStyle: jest.fn(),
        getRenderInactiveSegmentations: jest.fn(),
        getStyle: jest.fn(),
        resetToGlobalStyle: jest.fn(),
        setRenderInactiveSegmentations: jest.fn(),
        setStyle: jest.fn(),
      },
    },
    getLabelmapImageIds: jest.fn(),
    helpers: { convertStackToVolumeLabelmap: jest.fn() },
    removeSegment: jest.fn(),
    removeSegmentationRepresentations: jest.fn(),
    segmentIndex: {
      setActiveSegmentIndex: jest.fn(),
    },
    segmentLocking: {
      isSegmentIndexLocked: jest.fn(),
      setSegmentIndexLocked: jest.fn(),
    },
    state: {
      addColorLUT: jest.fn(),
      getSegmentation: jest.fn(),
      getSegmentations: jest.fn(),
      getSegmentationRepresentationsBySegmentationId: jest.fn(),
      getSegmentationRepresentations: jest.fn(),
      getViewportIdsWithSegmentation: jest.fn(),
      removeAllSegmentations: jest.fn(),
      removeSegmentation: jest.fn(),
      updateLabelmapSegmentationImageReferences: jest.fn(),
    },
    triggerSegmentationEvents: { triggerSegmentationRepresentationModified: jest.fn() },
  },
}));

const serviceManagerMock = {
  services: {
    cornerstoneViewportService: {
      getCornerstoneViewport: jest.fn(),
    },
    displaySetService: {
      getDisplaySetByUID: jest.fn(),
    },
    viewportGridService: {
      EVENTS: {
        GRID_STATE_CHANGED: 'event::gridStateChanged',
      },
      getState: jest.fn(),
      setDisplaySetsForViewport: jest.fn(),
      subscribe: jest.fn(),
    },
  },
};

describe('SegmentationService', () => {
  let service: SegmentationServiceClass;
  const viewportId = 'viewportId';
  const mockCornerstoneRepresentations = [
    {
      segmentationId: 'd7682642-c41d-abe5-3c78-716191336ab1',
      type: 'Labelmap',
      active: true,
      visible: true,
      colorLUTIndex: 0,
      segments: {
        '1': { visible: true },
      },
      config: {
        cfun: { nodes: [] },
        ofun: { nodes: [] },
        colorLUTIndex: 0,
        colorLUTOrIndex: 0,
      },
    },
    {
      segmentationId: 'd7682642-c41d-abe5-3c78-716191336ab2',
      type: 'Labelmap',
      active: true,
      visible: true,
      colorLUTIndex: 0,
      segments: {
        '1': { visible: true },
      },
      config: {
        cfun: { nodes: [] },
        ofun: { nodes: [] },
        colorLUTIndex: 0,
        colorLUTOrIndex: 0,
      },
    },
  ];
  const mockCornerstoneSegmentation = {
    segmentationId: '1d6ce0c8-aeae-6890-1cc6-b39560866811',
    label: 'Segmentation',
    cachedStats: {},
    segments: {
      '1': {
        active: true,
        cachedStats: {},
        label: 'Segment 1',
        locked: false,
        segmentIndex: 1,
      },
    },
    representationData: { Labelmap: {} },
  };
  const mockVolumeCornerstoneSegmentation = {
    ...mockCornerstoneSegmentation,
    representationData: { Labelmap: { volumeId: 'volumeId' } },
  };
  const mockCornerstoneStackViewport = {
    element: {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    id: viewportId,
    type: ViewportType.STACK,
    getFrameOfReferenceUID: jest.fn(),
    getViewPresentation: jest.fn(),
    getViewReference: jest.fn(),
  };
  const mockCornerstoneVolumeViewport = {
    id: viewportId,
    type: ViewportType.VOLUME_3D,
    getFrameOfReferenceUID: jest.fn(),
    setViewPresentation: jest.fn(),
    setViewReference: jest.fn(),
    render: jest.fn(),
  };
  const representations = [
    {
      ...mockCornerstoneRepresentations[0],
      viewportId: 'viewportId',
      id: 'test-id',
      label: 'Test Segmentation',
      styles: {},
      segments: {
        1: {
          color: [255, 0, 0, 1],
          opacity: 1,
          segmentIndex: 1,
          visible: true,
        },
      },
    },
  ] as SegmentationRepresentation[];

  beforeEach(() => {
    service = new SegmentationServiceClass({ servicesManager: serviceManagerMock });

    jest.clearAllMocks();
  });

  it('should instantiate the service properly', () => {
    expect(service).toBeDefined();
    expect(service.servicesManager).toBe(serviceManagerMock);
    expect(service.EVENTS).toBeDefined();
  });

  it('should instantiate service through registration', () => {
    // @ts-expect-error - mock only has a subset of the properties
    const service = SegmentationServiceClass.REGISTRATION.create({
      servicesManager: serviceManagerMock,
    });

    expect(service).toBeDefined();
  });

  describe('onModeEnter', () => {
    it('should add event listeners', () => {
      service.onModeEnter();

      expect(eventTarget.addEventListener).toHaveBeenCalledTimes(8);

      expect(eventTarget.addEventListener).toHaveBeenCalledWith(
        csToolsEnums.Events.SEGMENTATION_MODIFIED,
        expect.any(Function)
      );
      expect(eventTarget.addEventListener).toHaveBeenCalledWith(
        csToolsEnums.Events.SEGMENTATION_REMOVED,
        expect.any(Function)
      );
      expect(eventTarget.addEventListener).toHaveBeenCalledWith(
        csToolsEnums.Events.SEGMENTATION_DATA_MODIFIED,
        expect.any(Function)
      );
      expect(eventTarget.addEventListener).toHaveBeenCalledWith(
        csToolsEnums.Events.SEGMENTATION_REPRESENTATION_MODIFIED,
        expect.any(Function)
      );
      expect(eventTarget.addEventListener).toHaveBeenCalledWith(
        csToolsEnums.Events.SEGMENTATION_REPRESENTATION_ADDED,
        expect.any(Function)
      );
      expect(eventTarget.addEventListener).toHaveBeenCalledWith(
        csToolsEnums.Events.SEGMENTATION_REPRESENTATION_REMOVED,
        expect.any(Function)
      );
      expect(eventTarget.addEventListener).toHaveBeenCalledWith(
        csToolsEnums.Events.SEGMENTATION_ADDED,
        expect.any(Function)
      );
      expect(eventTarget.addEventListener).toHaveBeenCalledWith(
        csToolsEnums.Events.ANNOTATION_CUT_MERGE_PROCESS_COMPLETED,
        expect.any(Function)
      );
    });
  });

  describe('onModeExit', () => {
    it('should remove event listeners', () => {
      jest.spyOn(service, 'reset');

      service.onModeExit();

      expect(eventTarget.removeEventListener).toHaveBeenCalledTimes(7);

      expect(eventTarget.removeEventListener).toHaveBeenCalledWith(
        csToolsEnums.Events.SEGMENTATION_MODIFIED,
        expect.any(Function)
      );
      expect(eventTarget.removeEventListener).toHaveBeenCalledWith(
        csToolsEnums.Events.SEGMENTATION_REMOVED,
        expect.any(Function)
      );
      expect(eventTarget.removeEventListener).toHaveBeenCalledWith(
        csToolsEnums.Events.SEGMENTATION_DATA_MODIFIED,
        expect.any(Function)
      );
      expect(eventTarget.removeEventListener).toHaveBeenCalledWith(
        csToolsEnums.Events.SEGMENTATION_REPRESENTATION_MODIFIED,
        expect.any(Function)
      );
      expect(eventTarget.removeEventListener).toHaveBeenCalledWith(
        csToolsEnums.Events.SEGMENTATION_REPRESENTATION_ADDED,
        expect.any(Function)
      );
      expect(eventTarget.removeEventListener).toHaveBeenCalledWith(
        csToolsEnums.Events.SEGMENTATION_REPRESENTATION_REMOVED,
        expect.any(Function)
      );
      expect(eventTarget.removeEventListener).toHaveBeenCalledWith(
        csToolsEnums.Events.SEGMENTATION_ADDED,
        expect.any(Function)
      );

      expect(service.reset).toHaveBeenCalled();
    });
  });

  describe('getSegmentation', () => {
    it('should call cornerstone to get specific segmentation', () => {
      service.getSegmentation('segmentationId');

      expect(cstSegmentation.state.getSegmentation).toHaveBeenCalledWith('segmentationId');
    });
  });

  describe('getSegmentations', () => {
    it('should call cornerstone to get all segmentations', () => {
      service.getSegmentations();

      expect(cstSegmentation.state.getSegmentations).toHaveBeenCalled();
    });
  });

  describe('getPresentation', () => {
    it('should properly retrieve the segmentation presentations', () => {
      jest
        .spyOn(cstSegmentation.state, 'getSegmentationRepresentations')
        .mockReturnValueOnce(
          mockCornerstoneRepresentations as cstTypes.SegmentationRepresentation[]
        );
      jest
        .spyOn(cstSegmentation.state, 'getSegmentation')
        .mockReturnValue(mockCornerstoneSegmentation as cstTypes.Segmentation);
      jest
        .spyOn(cstSegmentation.config.color, 'getSegmentIndexColor')
        .mockReturnValue([0, 0, 0, 1]);
      jest
        .spyOn(cstSegmentation.config.visibility, 'getSegmentIndexVisibility')
        .mockReturnValue(true);
      jest.spyOn(cstSegmentation.config.style, 'getStyle').mockReturnValue({});

      const returnedPresentations = service.getPresentation(viewportId);

      // config is empty due to _toOHIFSegmentationRepresentation returning empty config
      expect(returnedPresentations).toEqual([
        {
          config: {},
          hydrated: true,
          segmentationId: 'd7682642-c41d-abe5-3c78-716191336ab1',
          type: 'Labelmap',
        },
        {
          config: {},
          hydrated: true,
          segmentationId: 'd7682642-c41d-abe5-3c78-716191336ab2',
          type: 'Labelmap',
        },
      ]);
    });

    it('should ignore when representation is undefined', () => {
      jest.spyOn(service, 'getSegmentationRepresentations').mockReturnValueOnce([undefined]);

      const returnedPresentations = service.getPresentation(viewportId);

      expect(returnedPresentations).toEqual([]);
    });
  });

  describe('getRepresentationsForSegmentation', () => {
    it('should call cornerstone to get representations for a segmentation', () => {
      service.getRepresentationsForSegmentation('segmentationId');

      expect(
        cstSegmentation.state.getSegmentationRepresentationsBySegmentationId
      ).toHaveBeenCalledWith('segmentationId');
    });
  });

  describe('getSegmentationRepresentations', () => {
    it('should properly map cornerstone representations to OHIF representations', () => {
      jest
        .spyOn(cstSegmentation.state, 'getSegmentationRepresentations')
        .mockReturnValueOnce(
          mockCornerstoneRepresentations as cstTypes.SegmentationRepresentation[]
        );
      jest
        .spyOn(cstSegmentation.state, 'getSegmentation')
        .mockReturnValue(mockCornerstoneSegmentation as cstTypes.Segmentation);
      jest
        .spyOn(cstSegmentation.config.color, 'getSegmentIndexColor')
        .mockReturnValue([0, 0, 0, 1]);
      jest
        .spyOn(cstSegmentation.config.visibility, 'getSegmentIndexVisibility')
        .mockReturnValue(true);
      jest.spyOn(cstSegmentation.config.style, 'getStyle').mockReturnValue({});

      const returnedPresentations = service.getSegmentationRepresentations(viewportId);

      expect(returnedPresentations).toEqual([
        {
          active: true,
          colorLUTIndex: 0,
          config: {},
          id: 'd7682642-c41d-abe5-3c78-716191336ab1-Labelmap-viewportId',
          label: 'Segmentation',
          segmentationId: 'd7682642-c41d-abe5-3c78-716191336ab1',
          segments: {
            '1': {
              color: [0, 0, 0, 1],
              opacity: 1,
              segmentIndex: 1,
              visible: true,
            },
          },
          styles: {},
          type: 'Labelmap',
          viewportId: 'viewportId',
          visible: true,
        },
        {
          active: true,
          colorLUTIndex: 0,
          config: {},
          id: 'd7682642-c41d-abe5-3c78-716191336ab2-Labelmap-viewportId',
          label: 'Segmentation',
          segmentationId: 'd7682642-c41d-abe5-3c78-716191336ab2',
          segments: {
            '1': {
              color: [0, 0, 0, 1],
              opacity: 1,
              segmentIndex: 1,
              visible: true,
            },
          },
          styles: {},
          type: 'Labelmap',
          viewportId: 'viewportId',
          visible: true,
        },
      ]);

      expect(cstSegmentation.state.getSegmentationRepresentations).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.state.getSegmentationRepresentations).toHaveBeenCalledWith(
        viewportId,
        {}
      );

      expect(cstSegmentation.state.getSegmentation).toHaveBeenCalledTimes(2);
      expect(cstSegmentation.state.getSegmentation).toHaveBeenCalledWith(
        mockCornerstoneRepresentations[0].segmentationId
      );
      expect(cstSegmentation.state.getSegmentation).toHaveBeenCalledWith(
        mockCornerstoneRepresentations[1].segmentationId
      );

      expect(cstSegmentation.config.color.getSegmentIndexColor).toHaveBeenCalledTimes(2);
      expect(cstSegmentation.config.color.getSegmentIndexColor).toHaveBeenCalledWith(
        viewportId,
        mockCornerstoneRepresentations[0].segmentationId,
        mockCornerstoneSegmentation.segments['1'].segmentIndex
      );
      expect(cstSegmentation.config.color.getSegmentIndexColor).toHaveBeenCalledWith(
        viewportId,
        mockCornerstoneRepresentations[1].segmentationId,
        mockCornerstoneSegmentation.segments['1'].segmentIndex
      );

      expect(cstSegmentation.config.visibility.getSegmentIndexVisibility).toHaveBeenCalledTimes(2);
      expect(cstSegmentation.config.visibility.getSegmentIndexVisibility).toHaveBeenCalledWith(
        viewportId,
        {
          segmentationId: mockCornerstoneRepresentations[0].segmentationId,
          type: mockCornerstoneRepresentations[0].type,
        },
        mockCornerstoneSegmentation.segments['1'].segmentIndex
      );
      expect(cstSegmentation.config.visibility.getSegmentIndexVisibility).toHaveBeenCalledWith(
        viewportId,
        {
          segmentationId: mockCornerstoneRepresentations[1].segmentationId,
          type: mockCornerstoneRepresentations[1].type,
        },
        mockCornerstoneSegmentation.segments['1'].segmentIndex
      );

      expect(cstSegmentation.config.style.getStyle).toHaveBeenCalledTimes(2);
      expect(cstSegmentation.config.style.getStyle).toHaveBeenCalledWith({
        viewportId,
        segmentationId: mockCornerstoneRepresentations[0].segmentationId,
        type: 'Labelmap',
      });
      expect(cstSegmentation.config.style.getStyle).toHaveBeenCalledWith({
        viewportId,
        segmentationId: mockCornerstoneRepresentations[1].segmentationId,
        type: 'Labelmap',
      });
    });

    it('should throw an error if the segmentation is not found', () => {
      jest
        .spyOn(cstSegmentation.state, 'getSegmentationRepresentations')
        .mockReturnValueOnce(
          mockCornerstoneRepresentations as cstTypes.SegmentationRepresentation[]
        );
      jest
        .spyOn(cstSegmentation.state, 'getSegmentation')
        .mockReturnValue(null as cstTypes.Segmentation);

      expect(() => service.getSegmentationRepresentations(viewportId)).toThrow(
        `Segmentation with ID ${mockCornerstoneRepresentations[0].segmentationId} not found.`
      );
    });

    it('should forward the specifier to the cornerstone getSegmentationRepresentations', () => {
      jest
        .spyOn(cstSegmentation.state, 'getSegmentationRepresentations')
        .mockReturnValueOnce(
          mockCornerstoneRepresentations as cstTypes.SegmentationRepresentation[]
        );
      jest
        .spyOn(cstSegmentation.state, 'getSegmentation')
        .mockReturnValue(mockCornerstoneSegmentation as cstTypes.Segmentation);
      jest
        .spyOn(cstSegmentation.config.color, 'getSegmentIndexColor')
        .mockReturnValue([0, 0, 0, 1]);
      jest
        .spyOn(cstSegmentation.config.visibility, 'getSegmentIndexVisibility')
        .mockReturnValue(true);
      jest.spyOn(cstSegmentation.config.style, 'getStyle').mockReturnValue({});

      service.getSegmentationRepresentations(viewportId, {
        segmentationId: mockCornerstoneRepresentations[0].segmentationId,
        type: mockCornerstoneRepresentations[0].type as csToolsEnums.SegmentationRepresentations,
      });

      expect(cstSegmentation.state.getSegmentationRepresentations).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.state.getSegmentationRepresentations).toHaveBeenCalledWith(
        viewportId,
        {
          segmentationId: mockCornerstoneRepresentations[0].segmentationId,
          type: mockCornerstoneRepresentations[0].type,
        }
      );
    });
  });

  describe('destroy', () => {
    it('should remove event listeners and reset the service', () => {
      jest.spyOn(service, 'reset');

      service.destroy();

      expect(eventTarget.removeEventListener).toHaveBeenCalledTimes(7);

      expect(eventTarget.removeEventListener).toHaveBeenCalledWith(
        csToolsEnums.Events.SEGMENTATION_MODIFIED,
        expect.any(Function)
      );
      expect(eventTarget.removeEventListener).toHaveBeenCalledWith(
        csToolsEnums.Events.SEGMENTATION_REMOVED,
        expect.any(Function)
      );
      expect(eventTarget.removeEventListener).toHaveBeenCalledWith(
        csToolsEnums.Events.SEGMENTATION_DATA_MODIFIED,
        expect.any(Function)
      );
      expect(eventTarget.removeEventListener).toHaveBeenCalledWith(
        csToolsEnums.Events.SEGMENTATION_REPRESENTATION_MODIFIED,
        expect.any(Function)
      );
      expect(eventTarget.removeEventListener).toHaveBeenCalledWith(
        csToolsEnums.Events.SEGMENTATION_REPRESENTATION_ADDED,
        expect.any(Function)
      );
      expect(eventTarget.removeEventListener).toHaveBeenCalledWith(
        csToolsEnums.Events.SEGMENTATION_REPRESENTATION_REMOVED,
        expect.any(Function)
      );
      expect(eventTarget.removeEventListener).toHaveBeenCalledWith(
        csToolsEnums.Events.SEGMENTATION_ADDED,
        expect.any(Function)
      );

      expect(service.reset).toHaveBeenCalled();
    });
  });

  describe('addSegmentationRepresentation', () => {
    describe('stack viewport', () => {
      it('should add a non volume segmentation representation to stack viewport through Cornerstone updateLabelmapSegmentationImageReferences', async () => {
        jest
          .spyOn(cstSegmentation.state, 'getSegmentation')
          .mockReturnValue(mockCornerstoneSegmentation as cstTypes.Segmentation);
        jest
          .spyOn(serviceManagerMock.services.cornerstoneViewportService, 'getCornerstoneViewport')
          // only needed interfaces for the addSegmentationRepresentation call
          .mockReturnValue(mockCornerstoneStackViewport as unknown as csTypes.IStackViewport);
        jest
          .spyOn(cstSegmentation.state, 'updateLabelmapSegmentationImageReferences')
          .mockReturnValue('labelmapImageId');
        jest
          .spyOn(cstSegmentation, 'addSegmentationRepresentations')
          .mockReturnValueOnce(undefined);

        const callback = jest.fn();
        service.subscribe(service.EVENTS.SEGMENTATION_REPRESENTATION_MODIFIED, callback);

        await service.addSegmentationRepresentation(viewportId, {
          segmentationId: mockCornerstoneSegmentation.segmentationId,
          type: csToolsEnums.SegmentationRepresentations.Labelmap,
        });

        expect(
          cstSegmentation.state.updateLabelmapSegmentationImageReferences
        ).toHaveBeenCalledTimes(1);
        expect(
          cstSegmentation.state.updateLabelmapSegmentationImageReferences
        ).toHaveBeenCalledWith(viewportId, mockCornerstoneSegmentation.segmentationId);

        // this will be called directly because there's no OHIF conversion needed
        expect(cstSegmentation.addSegmentationRepresentations).toHaveBeenCalledTimes(1);
        expect(cstSegmentation.addSegmentationRepresentations).toHaveBeenCalledWith(viewportId, [
          {
            type: csToolsEnums.SegmentationRepresentations.Labelmap,
            segmentationId: mockCornerstoneSegmentation.segmentationId,
            config: { colorLUTOrIndex: undefined }, // expected since _segmentationIdToColorLUTIndexMap wasn't previous set
          },
        ]);

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith({
          segmentationId: mockCornerstoneSegmentation.segmentationId,
        });
      });

      it('should add a non volume segmentation representation to stack viewport through SegmentationService conversion attempt', async () => {
        const frameOfReferenceUID = 'frameOfReferenceUID';
        const imageId = 'imageId';
        const viewportGridServiceUnsubscribe = jest.fn();

        const prevViewPresentation = {};
        const prevViewReference = {};

        mockCornerstoneStackViewport.getFrameOfReferenceUID.mockReturnValueOnce(
          frameOfReferenceUID
        );
        mockCornerstoneStackViewport.getViewPresentation.mockReturnValueOnce(prevViewPresentation);
        mockCornerstoneStackViewport.getViewReference.mockReturnValueOnce(prevViewReference);

        jest
          .spyOn(cstSegmentation.state, 'getSegmentation')
          .mockReturnValue(mockCornerstoneSegmentation as cstTypes.Segmentation);
        jest
          .spyOn(serviceManagerMock.services.cornerstoneViewportService, 'getCornerstoneViewport')
          // only needed interfaces for the addSegmentationRepresentation call
          .mockReturnValue(mockCornerstoneStackViewport as unknown as csTypes.IStackViewport);
        jest
          .spyOn(cstSegmentation.state, 'updateLabelmapSegmentationImageReferences')
          .mockReturnValue(undefined);
        jest.spyOn(cstSegmentation, 'getLabelmapImageIds').mockReturnValue([imageId]);
        jest
          .spyOn(cstSegmentation, 'addSegmentationRepresentations')
          .mockReturnValueOnce(undefined);
        jest
          .spyOn(cache, 'getImage')
          .mockReturnValueOnce({ FrameOfReferenceUID: frameOfReferenceUID } as csTypes.IImage);
        jest.spyOn(serviceManagerMock.services.viewportGridService, 'getState').mockReturnValue({
          viewports: new Map([
            [
              viewportId,
              { displaySetInstanceUIDs: ['displaySetInstanceUID'], viewportOptions: {} },
            ],
          ]),
        });
        jest
          .spyOn(cstSegmentation, 'addSegmentationRepresentations')
          .mockReturnValueOnce(undefined);
        jest.spyOn(serviceManagerMock.services.viewportGridService, 'subscribe').mockReturnValue({
          unsubscribe: viewportGridServiceUnsubscribe,
        });

        // awaiting here will wait for publishing of viewportGridService.EVENTS.GRID_STATE_CHANGED (deadlock avoidance)
        const serviceAddSegmentationRepresentationPromise = service.addSegmentationRepresentation(
          viewportId,
          {
            segmentationId: mockCornerstoneSegmentation.segmentationId,
            type: csToolsEnums.SegmentationRepresentations.Labelmap,
          }
        );

        let _addSegmentationRepresentationCallback;
        const waitForSubscription = async () => {
          let remainingAttempts = 100;

          while (_addSegmentationRepresentationCallback === undefined && remainingAttempts > 0) {
            _addSegmentationRepresentationCallback = jest.mocked(
              serviceManagerMock.services.viewportGridService.subscribe
            ).mock.calls[0]?.[1];

            await new Promise(resolve => resolve(void 0));
            remainingAttempts--;
          }
        };

        await waitForSubscription();

        // trigger callback being awaited
        _addSegmentationRepresentationCallback();
        await serviceAddSegmentationRepresentationPromise;

        expect(cstSegmentation.getLabelmapImageIds).toHaveBeenCalledTimes(1);
        expect(cstSegmentation.getLabelmapImageIds).toHaveBeenCalledWith(
          mockCornerstoneSegmentation.segmentationId
        );

        expect(mockCornerstoneStackViewport.getFrameOfReferenceUID).toHaveBeenCalledTimes(1);
        expect(mockCornerstoneStackViewport.getFrameOfReferenceUID).toHaveBeenCalledWith();

        expect(cache.getImage).toHaveBeenCalledTimes(1);
        expect(cache.getImage).toHaveBeenCalledWith(imageId);

        expect(serviceManagerMock.services.viewportGridService.getState).toHaveBeenCalledTimes(1);
        expect(serviceManagerMock.services.viewportGridService.getState).toHaveBeenCalledWith();

        expect(mockCornerstoneStackViewport.getViewPresentation).toHaveBeenCalledTimes(1);
        expect(mockCornerstoneStackViewport.getViewPresentation).toHaveBeenCalledWith();

        expect(mockCornerstoneStackViewport.getViewReference).toHaveBeenCalledTimes(1);
        expect(mockCornerstoneStackViewport.getViewReference).toHaveBeenCalledWith();

        expect(
          serviceManagerMock.services.cornerstoneViewportService.getCornerstoneViewport
        ).toHaveBeenCalledTimes(2);
        expect(
          serviceManagerMock.services.cornerstoneViewportService.getCornerstoneViewport
        ).toHaveBeenCalledWith(viewportId);

        expect(mockCornerstoneStackViewport.element.addEventListener).toHaveBeenCalledTimes(1);
        expect(mockCornerstoneStackViewport.element.addEventListener).toHaveBeenCalledWith(
          csEnums.Events.VOLUME_VIEWPORT_NEW_VOLUME,
          expect.any(Function)
        );

        const volumeViewportNewVolumeHandlerCallback = jest.mocked(
          mockCornerstoneStackViewport.element.addEventListener
        ).mock.calls[0][1];

        expect(
          serviceManagerMock.services.viewportGridService.setDisplaySetsForViewport
        ).toHaveBeenCalledTimes(1);
        expect(
          serviceManagerMock.services.viewportGridService.setDisplaySetsForViewport
        ).toHaveBeenCalledWith({
          viewportId,
          displaySetInstanceUIDs: ['displaySetInstanceUID'],
          viewportOptions: { viewportType: ViewportType.ORTHOGRAPHIC },
        });

        expect(
          cstSegmentation.triggerSegmentationEvents.triggerSegmentationRepresentationModified
        ).toHaveBeenCalledTimes(1);
        expect(
          cstSegmentation.triggerSegmentationEvents.triggerSegmentationRepresentationModified
        ).toHaveBeenCalledWith(
          viewportId,
          mockCornerstoneSegmentation.segmentationId,
          csToolsEnums.SegmentationRepresentations.Labelmap
        );

        jest
          .spyOn(serviceManagerMock.services.cornerstoneViewportService, 'getCornerstoneViewport')
          // only needed interfaces for the addSegmentationRepresentation call
          .mockReturnValue(mockCornerstoneVolumeViewport as unknown as csTypes.IVolumeViewport);

        volumeViewportNewVolumeHandlerCallback();

        expect(
          serviceManagerMock.services.cornerstoneViewportService.getCornerstoneViewport
        ).toHaveBeenCalledTimes(3);
        expect(
          serviceManagerMock.services.cornerstoneViewportService.getCornerstoneViewport
        ).toHaveBeenCalledWith(viewportId);

        expect(mockCornerstoneVolumeViewport.setViewPresentation).toHaveBeenCalledTimes(1);
        expect(mockCornerstoneVolumeViewport.setViewPresentation).toHaveBeenCalledWith(
          prevViewPresentation
        );

        expect(mockCornerstoneVolumeViewport.setViewReference).toHaveBeenCalledTimes(1);
        expect(mockCornerstoneVolumeViewport.setViewReference).toHaveBeenCalledWith(
          prevViewReference
        );

        expect(mockCornerstoneVolumeViewport.render).toHaveBeenCalledTimes(1);
        expect(mockCornerstoneVolumeViewport.render).toHaveBeenCalledWith();

        expect(mockCornerstoneStackViewport.element.removeEventListener).toHaveBeenCalledTimes(1);
        expect(mockCornerstoneStackViewport.element.removeEventListener).toHaveBeenCalledWith(
          csEnums.Events.VOLUME_VIEWPORT_NEW_VOLUME,
          expect.any(Function)
        );

        expect(serviceManagerMock.services.viewportGridService.subscribe).toHaveBeenCalledTimes(1);
        expect(serviceManagerMock.services.viewportGridService.subscribe).toHaveBeenCalledWith(
          serviceManagerMock.services.viewportGridService.EVENTS.GRID_STATE_CHANGED,
          expect.any(Function)
        );

        expect(cstSegmentation.addSegmentationRepresentations).toHaveBeenCalledTimes(1);
        expect(cstSegmentation.addSegmentationRepresentations).toHaveBeenCalledWith(viewportId, [
          {
            type: csToolsEnums.SegmentationRepresentations.Labelmap,
            segmentationId: mockCornerstoneSegmentation.segmentationId,
            config: { colorLUTOrIndex: undefined },
          },
        ]);

        expect(viewportGridServiceUnsubscribe).toHaveBeenCalledTimes(1);
        expect(viewportGridServiceUnsubscribe).toHaveBeenCalledWith();
      });

      it('should add a volume segmentation representation to stack viewport through SegmentationService conversion', async () => {
        mockCornerstoneStackViewport.getViewPresentation.mockReturnValueOnce({});
        mockCornerstoneStackViewport.getViewReference.mockReturnValueOnce({});

        jest
          .spyOn(cstSegmentation.state, 'getSegmentation')
          .mockReturnValue(mockVolumeCornerstoneSegmentation as cstTypes.Segmentation);
        jest
          .spyOn(serviceManagerMock.services.cornerstoneViewportService, 'getCornerstoneViewport')
          // only needed interfaces for the addSegmentationRepresentation call
          .mockReturnValue(mockCornerstoneStackViewport as unknown as csTypes.IStackViewport);
        jest.spyOn(serviceManagerMock.services.viewportGridService, 'getState').mockReturnValue({
          viewports: new Map([
            [
              viewportId,
              { displaySetInstanceUIDs: ['displaySetInstanceUID'], viewportOptions: {} },
            ],
          ]),
        });

        // awaiting here will wait for publishing of viewportGridService.EVENTS.GRID_STATE_CHANGED (deadlock avoidance)
        const serviceAddSegmentationRepresentationPromise = service.addSegmentationRepresentation(
          viewportId,
          {
            segmentationId: mockCornerstoneSegmentation.segmentationId,
            type: csToolsEnums.SegmentationRepresentations.Labelmap,
          }
        );

        let _addSegmentationRepresentationCallback;
        const waitForSubscription = async () => {
          let remainingAttempts = 100;

          while (_addSegmentationRepresentationCallback === undefined && remainingAttempts > 0) {
            _addSegmentationRepresentationCallback = jest.mocked(
              serviceManagerMock.services.viewportGridService.subscribe
            ).mock.calls[0]?.[1];

            await new Promise(resolve => resolve(void 0));
            remainingAttempts--;
          }
        };

        await waitForSubscription();

        // trigger callback being awaited
        _addSegmentationRepresentationCallback();
        await serviceAddSegmentationRepresentationPromise;

        // guarantee the early exit at handleStackViewportCase (isVolumeSegmentation)
        expect(
          cstSegmentation.state.updateLabelmapSegmentationImageReferences
        ).not.toHaveBeenCalled();

        expect(
          serviceManagerMock.services.viewportGridService.setDisplaySetsForViewport
        ).toHaveBeenCalledTimes(1);
        expect(
          serviceManagerMock.services.viewportGridService.setDisplaySetsForViewport
        ).toHaveBeenCalledWith({
          viewportId,
          displaySetInstanceUIDs: ['displaySetInstanceUID'],
          viewportOptions: { viewportType: ViewportType.ORTHOGRAPHIC },
        });

        const volumeViewportNewVolumeHandlerCallback = jest.mocked(
          mockCornerstoneStackViewport.element.addEventListener
        ).mock.calls[0][1];

        jest
          .spyOn(serviceManagerMock.services.cornerstoneViewportService, 'getCornerstoneViewport')
          // only needed interfaces for the addSegmentationRepresentation call
          .mockReturnValue(mockCornerstoneVolumeViewport as unknown as csTypes.IVolumeViewport);

        volumeViewportNewVolumeHandlerCallback();

        expect(
          serviceManagerMock.services.cornerstoneViewportService.getCornerstoneViewport
        ).toHaveBeenCalledTimes(3);
        expect(
          serviceManagerMock.services.cornerstoneViewportService.getCornerstoneViewport
        ).toHaveBeenCalledWith(viewportId);

        expect(mockCornerstoneStackViewport.element.removeEventListener).toHaveBeenCalledTimes(1);
        expect(mockCornerstoneStackViewport.element.removeEventListener).toHaveBeenCalledWith(
          csEnums.Events.VOLUME_VIEWPORT_NEW_VOLUME,
          expect.any(Function)
        );

        expect(cstSegmentation.addSegmentationRepresentations).toHaveBeenCalledTimes(1);
        expect(cstSegmentation.addSegmentationRepresentations).toHaveBeenCalledWith(viewportId, [
          {
            type: csToolsEnums.SegmentationRepresentations.Labelmap,
            segmentationId: mockCornerstoneSegmentation.segmentationId,
            config: { colorLUTOrIndex: undefined },
          },
        ]);
      });
    });

    describe('volume viewport', () => {
      it('should add a segmentation representation to volume viewport without need for handling', async () => {
        jest
          .spyOn(cstSegmentation.state, 'getSegmentation')
          .mockReturnValue(mockCornerstoneSegmentation as cstTypes.Segmentation);
        jest
          .spyOn(serviceManagerMock.services.cornerstoneViewportService, 'getCornerstoneViewport')
          // only needed interfaces for the addSegmentationRepresentation call
          .mockReturnValue(mockCornerstoneVolumeViewport as unknown as csTypes.IVolumeViewport);
        jest
          .spyOn(cstSegmentation, 'addSegmentationRepresentations')
          .mockReturnValueOnce(undefined);

        const callback = jest.fn();
        service.subscribe(service.EVENTS.SEGMENTATION_REPRESENTATION_MODIFIED, callback);

        await service.addSegmentationRepresentation(viewportId, {
          segmentationId: mockCornerstoneSegmentation.segmentationId,
          type: csToolsEnums.SegmentationRepresentations.Labelmap,
        });

        expect(serviceManagerMock.services.viewportGridService.getState).not.toHaveBeenCalled();

        expect(cstSegmentation.addSegmentationRepresentations).toHaveBeenCalledTimes(1);
        expect(cstSegmentation.addSegmentationRepresentations).toHaveBeenCalledWith(viewportId, [
          {
            type: csToolsEnums.SegmentationRepresentations.Surface,
            segmentationId: mockCornerstoneSegmentation.segmentationId,
            config: { colorLUTOrIndex: undefined },
          },
        ]);

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith({
          segmentationId: mockCornerstoneSegmentation.segmentationId,
        });
      });

      it('should add a surface segmentation representation to volume viewport without need for handling', async () => {
        jest
          .spyOn(cstSegmentation.state, 'getSegmentation')
          .mockReturnValue(mockCornerstoneSegmentation as cstTypes.Segmentation);
        jest
          .spyOn(serviceManagerMock.services.cornerstoneViewportService, 'getCornerstoneViewport')
          // only needed interfaces for the addSegmentationRepresentation call
          .mockReturnValue({
            ...mockCornerstoneVolumeViewport,
            type: ViewportType.VOLUME_3D,
          } as unknown as csTypes.IVolumeViewport);
        jest
          .spyOn(cstSegmentation, 'addSegmentationRepresentations')
          .mockReturnValueOnce(undefined);

        await service.addSegmentationRepresentation(viewportId, {
          segmentationId: mockCornerstoneSegmentation.segmentationId,
        });

        expect(serviceManagerMock.services.viewportGridService.getState).not.toHaveBeenCalled();

        expect(cstSegmentation.addSegmentationRepresentations).toHaveBeenCalledTimes(1);
        expect(cstSegmentation.addSegmentationRepresentations).toHaveBeenCalledWith(viewportId, [
          {
            type: csToolsEnums.SegmentationRepresentations.Surface,
            segmentationId: mockCornerstoneSegmentation.segmentationId,
            config: { colorLUTOrIndex: undefined },
          },
        ]);
      });

      it('should add a volume segmentation representation to volume viewport through SegmentationService handling', async () => {
        mockCornerstoneVolumeViewport.type = ViewportType.ORTHOGRAPHIC;
        jest
          .spyOn(cstSegmentation.state, 'getSegmentation')
          .mockReturnValue(mockVolumeCornerstoneSegmentation as cstTypes.Segmentation);
        jest
          .spyOn(serviceManagerMock.services.cornerstoneViewportService, 'getCornerstoneViewport')
          .mockReturnValue(mockCornerstoneVolumeViewport as unknown as csTypes.IVolumeViewport);
        jest
          .spyOn(cstSegmentation, 'addSegmentationRepresentations')
          .mockReturnValueOnce(undefined);

        const callback = jest.fn();
        service.subscribe(service.EVENTS.SEGMENTATION_REPRESENTATION_MODIFIED, callback);

        await service.addSegmentationRepresentation(viewportId, {
          segmentationId: mockCornerstoneSegmentation.segmentationId,
          type: csToolsEnums.SegmentationRepresentations.Labelmap,
        });

        expect(serviceManagerMock.services.viewportGridService.getState).not.toHaveBeenCalled();

        expect(mockCornerstoneVolumeViewport.getFrameOfReferenceUID).not.toHaveBeenCalled();

        expect(cstSegmentation.addSegmentationRepresentations).toHaveBeenCalledTimes(1);
        expect(cstSegmentation.addSegmentationRepresentations).toHaveBeenCalledWith(viewportId, [
          {
            type: csToolsEnums.SegmentationRepresentations.Labelmap,
            segmentationId: mockCornerstoneSegmentation.segmentationId,
            config: { colorLUTOrIndex: undefined },
          },
        ]);

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith({
          segmentationId: mockCornerstoneSegmentation.segmentationId,
        });
        mockCornerstoneVolumeViewport.type = ViewportType.VOLUME_3D;
      });

      it('should add a volume segmentation representation to volume viewport through SegmentationService handling', async () => {
        const frameOfReferenceUID = 'frameOfReferenceUID';
        const imageId = 'imageId';

        mockCornerstoneVolumeViewport.type = ViewportType.ORTHOGRAPHIC;
        mockCornerstoneVolumeViewport.getFrameOfReferenceUID.mockReturnValueOnce(
          frameOfReferenceUID
        );

        jest
          .spyOn(cstSegmentation.state, 'getSegmentation')
          .mockReturnValue(mockCornerstoneSegmentation as cstTypes.Segmentation);
        jest
          .spyOn(serviceManagerMock.services.cornerstoneViewportService, 'getCornerstoneViewport')
          .mockReturnValue(mockCornerstoneVolumeViewport as unknown as csTypes.IVolumeViewport);
        jest
          .spyOn(cstSegmentation, 'addSegmentationRepresentations')
          .mockReturnValueOnce(undefined);
        jest.spyOn(cstSegmentation, 'getLabelmapImageIds').mockReturnValue([imageId]);
        jest
          .spyOn(cache, 'getImage')
          .mockReturnValueOnce({ FrameOfReferenceUID: frameOfReferenceUID } as csTypes.IImage);
        jest
          .spyOn(cstSegmentation.helpers, 'convertStackToVolumeLabelmap')
          .mockReturnValueOnce(undefined);

        const callback = jest.fn();
        service.subscribe(service.EVENTS.SEGMENTATION_REPRESENTATION_MODIFIED, callback);

        await service.addSegmentationRepresentation(viewportId, {
          segmentationId: mockCornerstoneSegmentation.segmentationId,
          type: csToolsEnums.SegmentationRepresentations.Labelmap,
        });

        expect(mockCornerstoneVolumeViewport.getFrameOfReferenceUID).toHaveBeenCalledTimes(1);
        expect(mockCornerstoneVolumeViewport.getFrameOfReferenceUID).toHaveBeenCalledWith();

        expect(cstSegmentation.getLabelmapImageIds).toHaveBeenCalledTimes(1);
        expect(cstSegmentation.getLabelmapImageIds).toHaveBeenCalledWith(
          mockCornerstoneSegmentation.segmentationId
        );

        expect(cache.getImage).toHaveBeenCalledTimes(1);
        expect(cache.getImage).toHaveBeenCalledWith(imageId);

        expect(cstSegmentation.helpers.convertStackToVolumeLabelmap).toHaveBeenCalledTimes(1);
        expect(cstSegmentation.helpers.convertStackToVolumeLabelmap).toHaveBeenCalledWith(
          mockCornerstoneSegmentation
        );

        expect(cstSegmentation.addSegmentationRepresentations).toHaveBeenCalledTimes(1);
        expect(cstSegmentation.addSegmentationRepresentations).toHaveBeenCalledWith(viewportId, [
          {
            type: csToolsEnums.SegmentationRepresentations.Labelmap,
            segmentationId: mockCornerstoneSegmentation.segmentationId,
            config: { colorLUTOrIndex: undefined },
          },
        ]);

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith({
          segmentationId: mockCornerstoneSegmentation.segmentationId,
        });
        mockCornerstoneVolumeViewport.type = ViewportType.VOLUME_3D;
      });
    });

    it('should early return if the viewport is not found', () => {
      jest
        .spyOn(cstSegmentation.state, 'getSegmentation')
        .mockReturnValue(mockCornerstoneSegmentation as cstTypes.Segmentation);
      jest
        .spyOn(serviceManagerMock.services.cornerstoneViewportService, 'getCornerstoneViewport')
        .mockReturnValue(null);
      jest.spyOn(console, 'warn').mockReturnValue(undefined);

      const callback = jest.fn();
      service.subscribe(service.EVENTS.SEGMENTATION_REPRESENTATION_MODIFIED, callback);

      service.addSegmentationRepresentation(viewportId, {
        segmentationId: mockCornerstoneSegmentation.segmentationId,
      });

      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(`Viewport with id ${viewportId} not found.`);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('createLabelmapForDisplaySet', () => {
    it('should create a labelmap for a non dynamic volume display set', async () => {
      const displaySet = {
        imageIds: ['imageId'],
        isDynamicVolume: false,
        SeriesNumber: 1,
        SeriesDescription: 'Series Description',
      } as unknown as AppTypes.DisplaySet;

      jest
        .spyOn(imageLoader, 'createAndCacheDerivedLabelmapImages')
        .mockReturnValue([{ imageId: 'imageId' }] as csTypes.IImage[]);
      jest
        .spyOn(cstSegmentation.state, 'getSegmentations')
        .mockReturnValue([{ segmentationId: 'segmentationId' }] as cstTypes.Segmentation[]);
      jest.spyOn(service, 'addOrUpdateSegmentation').mockReturnValue(undefined);

      const retrievedSegmentationId = await service.createLabelmapForDisplaySet(displaySet);

      expect(imageLoader.createAndCacheDerivedLabelmapImages).toHaveBeenCalledTimes(1);
      expect(imageLoader.createAndCacheDerivedLabelmapImages).toHaveBeenCalledWith(['imageId']);

      expect(cstSegmentation.state.getSegmentations).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.state.getSegmentations).toHaveBeenCalledWith();

      expect(service.addOrUpdateSegmentation).toHaveBeenCalledTimes(1);
      expect(service.addOrUpdateSegmentation).toHaveBeenCalledWith({
        config: {
          cachedStats: {
            info: 'S1: Series Description',
          },
          label: 'Segmentation 2',
          segments: {
            '1': {
              active: true,
              label: 'Segment 1',
            },
          },
        },
        representation: {
          data: {
            imageIds: ['imageId'],
            referencedImageIds: ['imageId'],
          },
          type: 'Labelmap',
        },
        segmentationId: expect.any(String),
      });

      expect(retrievedSegmentationId).toEqual(expect.any(String));
    });

    it('should create a labelmap for a dynamic volume display set', async () => {
      const segmentationId = 'segmentationId';
      const displaySet = {
        imageIds: ['imageId'],
        isDynamicVolume: true,
        SeriesNumber: 1,
        SeriesDescription: 'Series Description',
        dynamicVolumeInfo: {
          timePoints: ['timePoint1', 'timePoint2', 'timePoint3'],
        },
      } as unknown as AppTypes.DisplaySet;

      jest
        .spyOn(imageLoader, 'createAndCacheDerivedLabelmapImages')
        .mockReturnValue([{ imageId: 'imageId' }] as csTypes.IImage[]);
      jest
        .spyOn(cstSegmentation.state, 'getSegmentations')
        .mockReturnValue([{ segmentationId }] as cstTypes.Segmentation[]);
      jest.spyOn(service, 'addOrUpdateSegmentation').mockReturnValue(undefined);

      const options = {
        segmentationId,
        segments: {
          1: {
            label: 'Custom Segment 1',
            active: true,
          },
        },
        FrameOfReferenceUID: 'frameOfReferenceUID',
        label: 'Segmentation 2',
      };

      const retrievedSegmentationId = await service.createLabelmapForDisplaySet(
        displaySet,
        options
      );

      expect(imageLoader.createAndCacheDerivedLabelmapImages).toHaveBeenCalledTimes(1);
      expect(imageLoader.createAndCacheDerivedLabelmapImages).toHaveBeenCalledWith('timePoint2');

      expect(service.addOrUpdateSegmentation).toHaveBeenCalledTimes(1);
      expect(service.addOrUpdateSegmentation).toHaveBeenCalledWith({
        config: {
          cachedStats: {
            info: 'S1: Series Description',
          },
          label: 'Segmentation 2',
          segments: {
            '1': {
              active: true,
              label: 'Custom Segment 1',
            },
          },
        },
        representation: {
          data: {
            imageIds: ['imageId'],
            referencedImageIds: 'timePoint2',
          },
          type: 'Labelmap',
        },
        segmentationId: segmentationId,
      });

      expect(retrievedSegmentationId).toEqual(segmentationId);
    });
  });

  describe('createSegmentationForSEGDisplaySet', () => {
    it('should throw an error if the type is not labelmap', async () => {
      await expect(
        service.createSegmentationForSEGDisplaySet(
          {},
          {
            type: csToolsEnums.SegmentationRepresentations.Contour,
          }
        )
      ).rejects.toThrow('Only labelmap type is supported for SEG display sets right now');
    });

    it('should throw and error if the labelmap images are not found', async () => {
      await expect(
        service.createSegmentationForSEGDisplaySet({
          labelMapImages: [],
        })
      ).rejects.toThrow('SEG reading failed');
    });

    it('should throw an error if the referenced display set is not found', async () => {
      jest
        .spyOn(serviceManagerMock.services.displaySetService, 'getDisplaySetByUID')
        .mockReturnValue({
          instances: [],
        });

      await expect(
        service.createSegmentationForSEGDisplaySet({
          displaySetInstanceUID: 'display-set-uid',
          referencedDisplaySetInstanceUID: 'non-existent-display-set-uid',
          labelMapImages: [{}, {}],
        })
      ).rejects.toThrow('No instances were provided for the referenced display set of the SEG');
    });

    it('it should create a segmentation for a SEG display set', async () => {
      const segmentationId = 'segmentationId';

      const voxelManager = {
        getScalarData: jest.fn().mockReturnValue([1, 0, 0]),
        setScalarData: jest.fn(),
      };

      const segDisplaySet = {
        centroids: new Map([
          [0, { image: { x: 0, y: 0, z: 0 }, world: { x: 0, y: 0, z: 0 } }],
          [2, { image: { x: 200, y: 200, z: 200 }, world: { x: 200, y: 200, z: 200 } }],
        ]),
        displaySetInstanceUID: 'display-set-uid',
        referencedDisplaySetInstanceUID: 'existent-display-set-uid',
        labelMapImages: [
          { imageId: 'imageId1', referencedImageId: 'referencedImageId1', voxelManager },
          { imageId: 'imageId2', referencedImageId: 'referencedImageId2', voxelManager },
        ],
        segMetadata: {
          data: [
            {},
            {
              SegmentedPropertyCategoryCodeSequence: {
                CodeMeaning: 'Segmented Property Category Code Sequence',
              },
              SegmentNumber: '1',
              SegmentLabel: 'Segment 1',
              SegmentAlgorithmType: 'MANUAL',
              SegmentAlgorithmName: 'OHIF Brush',
              SegmentedPropertyTypeCodeSequence: {
                CodeMeaning: 'Segmented Property Category Code Sequence',
              },
              rgba: [255, 0, 0, 255],
            },
            {
              SegmentedPropertyCategoryCodeSequence: {
                CodeMeaning: 'Segmented Property Category Code Sequence',
              },
              SegmentNumber: '2',
              SegmentAlgorithmType: 'MANUAL',
              SegmentAlgorithmName: 'OHIF Brush',
              SegmentedPropertyTypeCodeSequence: {
                CodeMeaning: 'Segmented Property Type Code Sequence',
              },
              rgba: [0, 255, 0, 255],
            },
          ],
        },
        SeriesDate: '2025-01-01',
        SeriesDescription: 'Series Description',
      };

      const referencedDisplaySet = {
        instances: [{ imageId: 'referencedImageId1' }, { imageId: 'referencedImageId2' }],
      };

      jest
        .spyOn(serviceManagerMock.services.displaySetService, 'getDisplaySetByUID')
        .mockReturnValue(referencedDisplaySet);
      // @ts-expect-error - jest can't handle Array.prototype.flat typing
      jest.spyOn(Array.prototype, 'flat');
      jest.spyOn(metaData, 'get').mockReturnValue({});
      jest.spyOn(service, 'addOrUpdateSegmentation').mockReturnValue(undefined);

      const callback = jest.fn();
      service.subscribe(service.EVENTS.SEGMENTATION_LOADING_COMPLETE, callback);

      const retrievedSegmentationId = await service.createSegmentationForSEGDisplaySet(
        segDisplaySet,
        {
          type: csToolsEnums.SegmentationRepresentations.Labelmap,
          segmentationId,
        }
      );

      expect(
        serviceManagerMock.services.displaySetService.getDisplaySetByUID
      ).toHaveBeenCalledTimes(1);
      expect(serviceManagerMock.services.displaySetService.getDisplaySetByUID).toHaveBeenCalledWith(
        'existent-display-set-uid'
      );

      expect(Array.prototype.flat).toHaveBeenCalledTimes(1);

      expect(metaData.get).toHaveBeenCalledTimes(2);
      expect(metaData.get).toHaveBeenCalledWith('instance', 'referencedImageId1');
      expect(metaData.get).toHaveBeenCalledWith('instance', 'referencedImageId2');

      expect(voxelManager.getScalarData).toHaveBeenCalledTimes(2);
      expect(voxelManager.getScalarData).toHaveBeenCalledWith();
      expect(voxelManager.setScalarData).toHaveBeenCalledTimes(2);
      expect(voxelManager.setScalarData).toHaveBeenCalledWith([1, 0, 0]);

      expect(cstSegmentation.state.addColorLUT).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.state.addColorLUT).toHaveBeenCalledWith([
        [0, 0, 0, 0],
        [255, 0, 0, 255],
        [0, 255, 0, 255],
      ]);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        segmentationId,
        segDisplaySet,
      });

      const expectedSegmentation = {
        config: {
          label: segDisplaySet.SeriesDescription,
          segments: {
            '1': {
              active: false,
              cachedStats: {
                algorithmName: 'OHIF Brush',
                algorithmType: 'MANUAL',
                category: 'Segmented Property Category Code Sequence',
                center: {
                  image: [0, 0, 0],
                  world: [0, 0, 0],
                },
                modifiedTime: '2025-01-01',
                type: 'Segmented Property Category Code Sequence',
              },
              label: 'Segment 1',
              locked: false,
              segmentIndex: 1,
            },
            '2': {
              active: false,
              cachedStats: {
                algorithmName: 'OHIF Brush',
                algorithmType: 'MANUAL',
                category: 'Segmented Property Category Code Sequence',
                center: {
                  image: [200, 200, 200],
                  world: [200, 200, 200],
                },
                modifiedTime: '2025-01-01',
                type: 'Segmented Property Type Code Sequence',
              },
              label: 'Segment 2',
              locked: false,
              segmentIndex: 2,
            },
          },
        },
        representation: {
          data: {
            imageIds: ['imageId1', 'imageId2'],
            referencedImageIds: ['referencedImageId1', 'referencedImageId2'],
          },
          type: csToolsEnums.SegmentationRepresentations.Labelmap,
        },
        segmentationId,
      };

      expect(service.addOrUpdateSegmentation).toHaveBeenCalledTimes(1);
      expect(service.addOrUpdateSegmentation).toHaveBeenCalledWith(expectedSegmentation);

      const expectedSegDisplaySet = {
        ...segDisplaySet,
        firstSegmentedSliceImageId: 'referencedImageId1',
        imageIds: ['imageId1', 'imageId2'],
        images: [
          {
            imageId: 'imageId1',
            referencedImageId: 'referencedImageId1',
            voxelManager,
          },
          {
            imageId: 'imageId2',
            referencedImageId: 'referencedImageId2',
            voxelManager,
          },
        ],
        isLoaded: true,
        labelMapImages: [
          {
            imageId: 'imageId1',
            referencedImageId: 'referencedImageId1',
            voxelManager,
          },
          {
            imageId: 'imageId2',
            referencedImageId: 'referencedImageId2',
            voxelManager,
          },
        ],
      };

      expect(segDisplaySet).toEqual(expectedSegDisplaySet);

      expect(retrievedSegmentationId).toEqual(segmentationId);
    });
  });

  describe('createSegmentationForRTDisplaySet', () => {
    it('should throw an error if the type is not contour', async () => {
      await expect(
        service.createSegmentationForRTDisplaySet(
          {
            modality: 'RTSTRUCT',
          },
          {
            type: csToolsEnums.SegmentationRepresentations.Labelmap,
          }
        )
      ).rejects.toThrow('Only contour type is supported for RT display sets right now');
    });

    it('should throw an error if the structureSet is not loaded', async () => {
      await expect(
        service.createSegmentationForRTDisplaySet(
          {
            modality: 'RTSTRUCT',
            displaySetInstanceUID: 'display-set-uid',
          },
          {
            type: csToolsEnums.SegmentationRepresentations.Contour,
          }
        )
      ).rejects.toThrow(
        'To create the contours from RT displaySet, the displaySet should be loaded first. You can perform rtDisplaySet.load() before calling this method.'
      );
    });

    it('should throw and error if structureSet does not contain any ROIContours', async () => {
      const rtStructDisplaySet = {
        modality: 'RTSTRUCT',
        displaySetInstanceUID: 'display-set-uid',
        referencedDisplaySetInstanceUID: 'existent-display-set-uid',
        structureSet: {
          ReferencedSOPInstanceUIDsSet: new Set(['referencedImageId1', 'referencedImageId2']),
          ROIContours: [],
        },
      };

      const referencedDisplaySet = {
        instances: [{ imageId: 'referencedImageId1' }, { imageId: 'referencedImageId2' }],
      };

      jest
        .spyOn(serviceManagerMock.services.displaySetService, 'getDisplaySetByUID')
        .mockReturnValue(referencedDisplaySet);

      await expect(
        service.createSegmentationForRTDisplaySet(rtStructDisplaySet, {
          type: csToolsEnums.SegmentationRepresentations.Contour,
        })
      ).rejects.toThrow(
        'The structureSet does not contain any ROIContours. Please ensure the structureSet is loaded first.'
      );

      expect(
        serviceManagerMock.services.displaySetService.getDisplaySetByUID
      ).toHaveBeenCalledTimes(1);
      expect(serviceManagerMock.services.displaySetService.getDisplaySetByUID).toHaveBeenCalledWith(
        'existent-display-set-uid'
      );
    });

    it('should create a segmentation for a RTSTRUCT display set', async () => {
      const segmentationId = 'segmentationId';
      const rtStructDisplaySet = {
        modality: 'RTSTRUCT',
        displaySetInstanceUID: 'display-set-uid',
        referencedDisplaySetInstanceUID: 'existent-display-set-uid',
        SeriesDate: '2025-01-01',
        SeriesDescription: 'Series Description',
        structureSet: {
          ReferencedSOPInstanceUIDsSet: new Set(['referencedIsmageId1', 'referencedImageId2']),
          ROIContours: [{}, {}, {}],
          frameOfReferenceUID: 'frameOfReferenceUID',
        },
      };

      const referencedDisplaySet = {
        instances: [{ imageId: 'referencedImageId1' }, { imageId: 'referencedImageId2' }],
        imageIds: ['referencedImageId1', 'referencedImageId2'],
      };

      const allRTStructData = [
        {
          data: {},
          id: 'id3',
          color: [255, 0, 0, 255],
          group: 'group3',
          segmentIndex: 3,
          geometryId: 'geometryId3',
        },
        {
          data: {},
          id: 'id2',
          color: [0, 255, 0, 255],
          group: 'group2',
          segmentIndex: 2,
          geometryId: 'geometryId2',
        },
        {
          data: {},
          id: 'id1',
          color: [0, 0, 255, 255],
          group: 'group1',
          segmentIndex: 1,
          geometryId: 'geometryId1',
        },
      ];

      jest
        .spyOn(serviceManagerMock.services.displaySetService, 'getDisplaySetByUID')
        .mockReturnValue(referencedDisplaySet);
      jest
        .spyOn(MapROIContoursToRTStructData, 'mapROIContoursToRTStructData')
        .mockReturnValue(allRTStructData);
      jest.spyOn(service, 'addOrUpdateSegmentation').mockReturnValue(undefined);
      jest.spyOn(geometryLoader, 'createAndCacheGeometry').mockReturnValue({
        // @ts-expect-error - only mocking needed properties
        data: { centroid: [0, 0, 0] },
      });

      const segmentLoadingCompleteCallback = jest.fn();
      service.subscribe(service.EVENTS.SEGMENT_LOADING_COMPLETE, segmentLoadingCompleteCallback);

      const segmentationLoadingCompleteCallback = jest.fn();
      service.subscribe(
        service.EVENTS.SEGMENTATION_LOADING_COMPLETE,
        segmentationLoadingCompleteCallback
      );

      const retrievedSegmentationId = await service.createSegmentationForRTDisplaySet(
        rtStructDisplaySet,
        {
          type: csToolsEnums.SegmentationRepresentations.Contour,
          segmentationId,
        }
      );

      expect(MapROIContoursToRTStructData.mapROIContoursToRTStructData).toHaveBeenCalledTimes(1);
      expect(MapROIContoursToRTStructData.mapROIContoursToRTStructData).toHaveBeenCalledWith(
        rtStructDisplaySet.structureSet,
        rtStructDisplaySet.displaySetInstanceUID
      );

      expect(geometryLoader.createAndCacheGeometry).toHaveBeenCalledTimes(3);
      allRTStructData.forEach(data => {
        expect(geometryLoader.createAndCacheGeometry).toHaveBeenCalledWith(data.geometryId, {
          geometryData: {
            data: data.data,
            id: data.id,
            color: data.color,
            frameOfReferenceUID: rtStructDisplaySet.structureSet.frameOfReferenceUID,
            segmentIndex: data.segmentIndex,
          },
          type: csEnums.GeometryType.CONTOUR,
        });
      });

      expect(segmentLoadingCompleteCallback).toHaveBeenCalledTimes(3);
      expect(segmentLoadingCompleteCallback).toHaveBeenCalledWith({
        percentComplete: expect.any(Number),
        numSegments: 3,
      });

      expect(cstSegmentation.state.addColorLUT).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.state.addColorLUT).toHaveBeenCalledWith([
        [0, 0, 0, 0],
        [0, 0, 255, 255],
        [0, 255, 0, 255],
        [255, 0, 0, 255],
      ]);

      expect(segmentationLoadingCompleteCallback).toHaveBeenCalledTimes(1);
      expect(segmentationLoadingCompleteCallback).toHaveBeenCalledWith({
        segmentationId,
        rtDisplaySet: rtStructDisplaySet,
      });

      const expectedSegmentation = {
        config: {
          label: rtStructDisplaySet.SeriesDescription,
          segments: {
            '1': {
              active: false,
              cachedStats: {
                center: {
                  world: [0, 0, 0],
                },
                modifiedTime: rtStructDisplaySet.SeriesDate,
              },
              group: 'group1',
              label: 'id1',
              locked: false,
              segmentIndex: 1,
            },
            '2': {
              active: false,
              cachedStats: {
                center: {
                  world: [0, 0, 0],
                },
                modifiedTime: rtStructDisplaySet.SeriesDate,
              },
              group: 'group2',
              label: 'id2',
              locked: false,
              segmentIndex: 2,
            },
            '3': {
              active: false,
              cachedStats: {
                center: {
                  world: [0, 0, 0],
                },
                modifiedTime: rtStructDisplaySet.SeriesDate,
              },
              group: 'group3',
              label: 'id3',
              locked: false,
              segmentIndex: 3,
            },
          },
        },
        representation: {
          data: {
            geometryIds: ['geometryId1', 'geometryId2', 'geometryId3'],
          },
          type: csToolsEnums.SegmentationRepresentations.Contour,
        },
        segmentationId,
      };
      expect(service.addOrUpdateSegmentation).toHaveBeenCalledTimes(1);
      expect(service.addOrUpdateSegmentation).toHaveBeenCalledWith(expectedSegmentation);

      expect(retrievedSegmentationId).toEqual(segmentationId);

      const expectedRtStructDisplaySet = {
        ...rtStructDisplaySet,
        isLoaded: true,
      };

      expect(rtStructDisplaySet).toEqual(expectedRtStructDisplaySet);
    });

    it('should ignore when a segment fails to initialize', async () => {
      const segmentationId = 'segmentationId';
      const rtStructDisplaySet = {
        modality: 'RTSTRUCT',
        displaySetInstanceUID: 'display-set-uid',
        referencedDisplaySetInstanceUID: 'existent-display-set-uid',
        SeriesDate: '2025-01-01',
        SeriesDescription: 'Series Description',
        structureSet: {
          ReferencedSOPInstanceUIDsSet: new Set(['referencedIsmageId1', 'referencedImageId2']),
          ROIContours: [{}, {}, {}],
          frameOfReferenceUID: 'frameOfReferenceUID',
        },
      };

      const referencedDisplaySet = {
        instances: [{ imageId: 'referencedImageId1' }, { imageId: 'referencedImageId2' }],
      };

      const allRTStructData = [
        {
          data: {},
          id: 'id3',
          color: [255, 0, 0, 255],
          group: 'group3',
          segmentIndex: 3,
          geometryId: 'geometryId3',
        },
      ];

      jest
        .spyOn(serviceManagerMock.services.displaySetService, 'getDisplaySetByUID')
        .mockReturnValue(referencedDisplaySet);
      jest
        .spyOn(MapROIContoursToRTStructData, 'mapROIContoursToRTStructData')
        .mockReturnValue(allRTStructData);
      jest
        .spyOn(geometryLoader, 'createAndCacheGeometry')
        .mockRejectedValue(new Error('Segment Initialization Error') as never);
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      jest.spyOn(service, 'addOrUpdateSegmentation').mockReturnValue(undefined);

      const segmentLoadingCompleteCallback = jest.fn();
      service.subscribe(service.EVENTS.SEGMENT_LOADING_COMPLETE, segmentLoadingCompleteCallback);

      const segmentationLoadingCompleteCallback = jest.fn();
      service.subscribe(
        service.EVENTS.SEGMENTATION_LOADING_COMPLETE,
        segmentationLoadingCompleteCallback
      );

      await expect(
        service.createSegmentationForRTDisplaySet(rtStructDisplaySet, {
          type: csToolsEnums.SegmentationRepresentations.Contour,
          segmentationId,
        })
      ).resolves.not.toThrow();

      expect(segmentLoadingCompleteCallback).not.toHaveBeenCalled();

      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        `Error initializing contour for segment ${allRTStructData[0].segmentIndex}:`,
        expect.any(Error)
      );

      expect(segmentationLoadingCompleteCallback).toHaveBeenCalledTimes(1);

      expect(service.addOrUpdateSegmentation).toHaveBeenCalledTimes(1);
    });
  });

  describe('addOrUpdateSegmentation', () => {
    it('should add new segmentation if it does not exist', () => {
      const segmentationId = 'segmentationId';
      const segmentationData = {
        segmentationId,
        config: {
          label: 'Segmentation 1',
        },
      };

      jest.spyOn(cstSegmentation.state, 'getSegmentation').mockReturnValue(undefined);
      jest.spyOn(cstSegmentation, 'addSegmentations').mockReturnValue(undefined);

      service.addOrUpdateSegmentation(segmentationData);

      expect(cstSegmentation.state.getSegmentation).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.state.getSegmentation).toHaveBeenCalledWith(segmentationId);

      expect(cstSegmentation.addSegmentations).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.addSegmentations).toHaveBeenCalledWith([segmentationData]);
    });

    it('should update existing segmentation if it exists', () => {
      const segmentationId = 'segmentationId';
      const segmentationData = {
        segmentationId,
        config: {
          label: 'Segmentation 1',
        },
      };

      jest
        .spyOn(cstSegmentation.state, 'getSegmentation')
        .mockReturnValue(mockCornerstoneSegmentation);
      jest.spyOn(cstSegmentation, 'updateSegmentations').mockReturnValue(undefined);

      service.addOrUpdateSegmentation(segmentationData);

      expect(cstSegmentation.updateSegmentations).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.updateSegmentations).toHaveBeenCalledWith([
        { segmentationId, payload: segmentationData },
      ]);
    });
  });

  describe('setActiveSegmentation', () => {
    it('should set the active segmentation for a viewport', () => {
      const viewportId = 'viewportId';
      const segmentationId = 'segmentationId';

      service.setActiveSegmentation(viewportId, segmentationId);

      expect(cstSegmentation.activeSegmentation.setActiveSegmentation).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.activeSegmentation.setActiveSegmentation).toHaveBeenCalledWith(
        viewportId,
        segmentationId
      );
    });
  });

  describe('getActiveSegmentation', () => {
    it('should get the active segmentation for a viewport', () => {
      const viewportId = 'viewportId';

      service.getActiveSegmentation(viewportId);

      expect(cstSegmentation.activeSegmentation.getActiveSegmentation).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.activeSegmentation.getActiveSegmentation).toHaveBeenCalledWith(
        viewportId
      );
    });
  });

  describe('getActiveSegment', () => {
    it('should return undefined if no active segmentation', () => {
      const viewportId = 'viewportId';
      jest.spyOn(cstSegmentation.activeSegmentation, 'getActiveSegmentation').mockReturnValue(null);

      const activeSegment = service.getActiveSegment(viewportId);

      expect(cstSegmentation.activeSegmentation.getActiveSegmentation).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.activeSegmentation.getActiveSegmentation).toHaveBeenCalledWith(
        viewportId
      );

      expect(activeSegment).toBeUndefined();
    });

    it('should find and return the active segment', () => {
      const viewportId = 'viewportId';
      jest
        .spyOn(cstSegmentation.activeSegmentation, 'getActiveSegmentation')
        .mockReturnValue(mockCornerstoneSegmentation);

      const activeSegment = service.getActiveSegment(viewportId);

      expect(activeSegment).toEqual(mockCornerstoneSegmentation.segments['1']);
    });
  });

  describe('hasCustomStyles', () => {
    it('should return true if the segmentation has custom styles', () => {
      const viewportId = 'viewportId';
      const segmentationId = 'segmentationId';
      const type = csToolsEnums.SegmentationRepresentations.Contour;

      jest.spyOn(cstSegmentation.config.style, 'hasCustomStyle').mockReturnValue(true);

      const hasCustomStyles = service.hasCustomStyles({ viewportId, segmentationId, type });

      expect(cstSegmentation.config.style.hasCustomStyle).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.config.style.hasCustomStyle).toHaveBeenCalledWith({
        viewportId,
        segmentationId,
        type,
      });

      expect(hasCustomStyles).toBe(true);
    });
  });

  describe('getStyle', () => {
    it('should return the style for the segmentation', () => {
      const viewportId = 'viewportId';
      const segmentationId = 'segmentationId';
      const type = csToolsEnums.SegmentationRepresentations.Contour;
      const segmentIndex = 1;

      jest.spyOn(cstSegmentation.config.style, 'getStyle').mockReturnValue({});

      const style = service.getStyle({ viewportId, segmentationId, type, segmentIndex });

      expect(cstSegmentation.config.style.getStyle).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.config.style.getStyle).toHaveBeenCalledWith({
        viewportId,
        segmentationId,
        type,
        segmentIndex,
      });

      expect(style).toEqual({});
    });
  });

  describe('setStyle', () => {
    it('should set the style for the segmentation', () => {
      const viewportId = 'viewportId';
      const segmentationId = 'segmentationId';
      const type = csToolsEnums.SegmentationRepresentations.Contour;
      const segmentIndex = 1;
      const style = {
        fillAlpha: 0.5,
        outlineWidth: 2,
        renderOutline: true,
        renderFill: true,
      };

      jest.spyOn(cstSegmentation.config.style, 'setStyle').mockReturnValue(undefined);

      service.setStyle({ viewportId, segmentationId, type, segmentIndex }, style);

      expect(cstSegmentation.config.style.setStyle).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.config.style.setStyle).toHaveBeenCalledWith(
        {
          viewportId,
          segmentationId,
          type,
          segmentIndex,
        },
        style,
        true
      );
    });
  });

  describe('resetToGlobalStyle', () => {
    it('should reset the style for the segmentation', () => {
      jest.spyOn(cstSegmentation.config.style, 'resetToGlobalStyle').mockReturnValue(undefined);

      service.resetToGlobalStyle();

      expect(cstSegmentation.config.style.resetToGlobalStyle).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.config.style.resetToGlobalStyle).toHaveBeenCalledWith();
    });
  });

  describe('addSegment', () => {
    it('should throw an error if the segment index is 0', () => {
      const segmentationId = 'segmentationId';
      const config = {
        segmentIndex: 0,
      };

      expect(() => service.addSegment(segmentationId, config)).toThrow(
        'Segment index 0 is reserved for "no label"'
      );
    });

    it('should add a new segment with next available index if not provided', () => {
      const segmentationId = 'segmentationId';
      const config = {
        label: 'New Segment 2',
        visibility: true,
      };

      jest
        .spyOn(cstSegmentation.state, 'getSegmentation')
        .mockReturnValue(mockCornerstoneSegmentation);
      jest.spyOn(cstSegmentation, 'updateSegmentations').mockReturnValue(undefined);
      jest.spyOn(cstSegmentation.segmentIndex, 'setActiveSegmentIndex').mockReturnValue(undefined);
      jest
        .spyOn(cstSegmentation.state, 'getViewportIdsWithSegmentation')
        .mockReturnValue(['viewportId']);
      jest
        .spyOn(cstSegmentation.config.visibility, 'setSegmentIndexVisibility')
        .mockReturnValue(undefined);

      service.addSegment(segmentationId, config);

      expect(cstSegmentation.state.getSegmentation).toHaveBeenCalledTimes(2);
      expect(cstSegmentation.state.getSegmentation).toHaveBeenCalledWith(segmentationId);

      expect(cstSegmentation.updateSegmentations).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.updateSegmentations).toHaveBeenCalledWith([
        {
          segmentationId,
          payload: {
            segments: {
              ...mockCornerstoneSegmentation.segments,
              '2': {
                label: 'New Segment 2',
                segmentIndex: 2,
                cachedStats: {},
                locked: false,
                ...config,
              },
            },
          },
        },
      ]);

      expect(cstSegmentation.segmentIndex.setActiveSegmentIndex).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.segmentIndex.setActiveSegmentIndex).toHaveBeenCalledWith(
        segmentationId,
        2
      );

      expect(cstSegmentation.state.getViewportIdsWithSegmentation).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.state.getViewportIdsWithSegmentation).toHaveBeenCalledWith(
        segmentationId
      );

      expect(cstSegmentation.config.visibility.setSegmentIndexVisibility).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.config.visibility.setSegmentIndexVisibility).toHaveBeenCalledWith(
        'viewportId',
        { segmentationId, type: undefined },
        2,
        config.visibility
      );
    });

    it('should set properties if segment index already exists', () => {
      const segmentationId = 'segmentationId';
      const config = {
        segmentIndex: 1,
        isLocked: false,
        active: true,
        color: [255, 0, 0, 255] as csTypes.Color,
      };

      jest
        .spyOn(cstSegmentation.state, 'getSegmentation')
        .mockReturnValue(mockCornerstoneSegmentation);
      jest.spyOn(cstSegmentation, 'updateSegmentations').mockReturnValue(undefined);
      jest.spyOn(cstSegmentation.segmentIndex, 'setActiveSegmentIndex').mockReturnValue(undefined);
      jest.spyOn(service, 'getViewportIdsWithSegmentation').mockReturnValue(['viewportId']);
      jest
        .spyOn(cstSegmentation.segmentLocking, 'setSegmentIndexLocked')
        .mockReturnValue(undefined);
      jest.spyOn(cstSegmentation.config.color, 'setSegmentIndexColor').mockReturnValue(undefined);
      jest
        .spyOn(cstSegmentation.state, 'getSegmentationRepresentations')
        .mockReturnValue([{ colorLUTIndex: 1 }] as cstTypes.SegmentationRepresentation[]);

      service.addSegment(segmentationId, config);

      expect(cstSegmentation.updateSegmentations).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.updateSegmentations).toHaveBeenCalledWith([
        {
          segmentationId,
          payload: {
            segments: {
              ...mockCornerstoneSegmentation.segments,
              '1': {
                label: 'Segment 1',
                segmentIndex: 1,
                cachedStats: {},
                locked: false,
                active: true,
                ...config,
              },
            },
          },
        },
      ]);

      expect(cstSegmentation.segmentLocking.setSegmentIndexLocked).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.segmentLocking.setSegmentIndexLocked).toHaveBeenCalledWith(
        segmentationId,
        1,
        config.isLocked
      );

      expect(cstSegmentation.config.color.setSegmentIndexColor).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.config.color.setSegmentIndexColor).toHaveBeenCalledWith(
        'viewportId',
        segmentationId,
        1,
        config.color
      );
    });
  });

  describe('removeSegment', () => {
    it('should remove the segment', () => {
      const segmentationId = 'segmentationId';
      const segmentIndex = 1;
      jest.spyOn(cstSegmentation, 'removeSegment').mockReturnValue(undefined);

      service.removeSegment(segmentationId, segmentIndex);

      expect(cstSegmentation.removeSegment).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.removeSegment).toHaveBeenCalledWith(segmentationId, segmentIndex);
    });
  });

  describe('setSegmentVisibility', () => {
    it('should set the visibility of the segment', () => {
      const viewportId = 'viewportId';
      const segmentationId = 'segmentationId';
      const segmentIndex = 1;
      const isVisible = true;
      const type = csToolsEnums.SegmentationRepresentations.Contour;

      jest
        .spyOn(cstSegmentation.config.visibility, 'setSegmentIndexVisibility')
        .mockReturnValue(undefined);

      service.setSegmentVisibility(viewportId, segmentationId, segmentIndex, isVisible, type);

      expect(cstSegmentation.config.visibility.setSegmentIndexVisibility).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.config.visibility.setSegmentIndexVisibility).toHaveBeenCalledWith(
        viewportId,
        { segmentationId, type },
        segmentIndex,
        isVisible
      );
    });
  });

  describe('setSegmentLocked', () => {
    it('should set the locked status of the segment', () => {
      const segmentationId = 'segmentationId';
      const segmentIndex = 1;
      const isLocked = true;

      jest
        .spyOn(cstSegmentation.segmentLocking, 'setSegmentIndexLocked')
        .mockReturnValue(undefined);

      service.setSegmentLocked(segmentationId, segmentIndex, isLocked);

      expect(cstSegmentation.segmentLocking.setSegmentIndexLocked).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.segmentLocking.setSegmentIndexLocked).toHaveBeenCalledWith(
        segmentationId,
        segmentIndex,
        isLocked
      );
    });
  });

  describe('toggleSegmentLocked', () => {
    it('should toggle the locked status of the segment', () => {
      const segmentationId = 'segmentationId';
      const segmentIndex = 1;
      const isLocked = true;

      jest.spyOn(cstSegmentation.segmentLocking, 'isSegmentIndexLocked').mockReturnValue(isLocked);
      jest
        .spyOn(cstSegmentation.segmentLocking, 'setSegmentIndexLocked')
        .mockReturnValue(undefined);

      service.toggleSegmentLocked(segmentationId, segmentIndex);

      expect(cstSegmentation.segmentLocking.isSegmentIndexLocked).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.segmentLocking.isSegmentIndexLocked).toHaveBeenCalledWith(
        segmentationId,
        segmentIndex
      );

      expect(cstSegmentation.segmentLocking.setSegmentIndexLocked).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.segmentLocking.setSegmentIndexLocked).toHaveBeenCalledWith(
        segmentationId,
        segmentIndex,
        !isLocked
      );
    });
  });

  describe('toggleSegmentVisibility', () => {
    it('should toggle the visibility of the segment', () => {
      const viewportId = 'viewportId';
      const segmentationId = 'segmentationId';
      const segmentIndex = 1;
      const isVisible = true;
      const type = csToolsEnums.SegmentationRepresentations.Contour;

      jest
        .spyOn(cstSegmentation.config.visibility, 'getSegmentIndexVisibility')
        .mockReturnValue(isVisible);
      jest
        .spyOn(cstSegmentation.config.visibility, 'setSegmentIndexVisibility')
        .mockReturnValue(undefined);

      service.toggleSegmentVisibility(viewportId, segmentationId, segmentIndex, type);

      expect(cstSegmentation.config.visibility.getSegmentIndexVisibility).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.config.visibility.getSegmentIndexVisibility).toHaveBeenCalledWith(
        viewportId,
        { segmentationId, type },
        segmentIndex
      );

      expect(cstSegmentation.config.visibility.setSegmentIndexVisibility).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.config.visibility.setSegmentIndexVisibility).toHaveBeenCalledWith(
        viewportId,
        { segmentationId, type },
        segmentIndex,
        !isVisible
      );
    });
  });

  describe('setSegmentColor', () => {
    const viewportId = 'viewportId';
    const segmentationId = 'segmentationId';
    const segmentIndex = 1;
    const color = [255, 0, 0, 255] as csTypes.Color;

    it('should set the color of the segment', () => {
      jest
        .spyOn(cstSegmentation.state, 'getSegmentationRepresentations')
        .mockReturnValue([{ colorLUTIndex: 1 }] as cstTypes.SegmentationRepresentation[]);
      jest.spyOn(cstSegmentation.config.color, 'setSegmentIndexColor').mockReturnValue(undefined);

      service.setSegmentColor(viewportId, segmentationId, segmentIndex, color);

      expect(cstSegmentation.state.getSegmentationRepresentations).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.state.getSegmentationRepresentations).toHaveBeenCalledWith(
        viewportId,
        { segmentationId }
      );

      expect(cstSegmentation.config.color.setSegmentIndexColor).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.config.color.setSegmentIndexColor).toHaveBeenCalledWith(
        viewportId,
        segmentationId,
        segmentIndex,
        color
      );
    });

    it('should set the color of the segment with the colorLUTIndex', async () => {
      jest
        .spyOn(cstSegmentation.state, 'getSegmentationRepresentations')
        .mockReturnValue([{ colorLUTIndex: 1 }] as cstTypes.SegmentationRepresentation[]);
      jest.spyOn(cstSegmentation.config.color, 'setSegmentIndexColor').mockReturnValue(undefined);

      service.setSegmentColor(viewportId, segmentationId, segmentIndex, color);

      jest
        .spyOn(cstSegmentation.state, 'getSegmentation')
        .mockReturnValue(mockCornerstoneSegmentation as cstTypes.Segmentation);
      jest
        .spyOn(serviceManagerMock.services.cornerstoneViewportService, 'getCornerstoneViewport')
        // only needed interfaces for the addSegmentationRepresentation call
        .mockReturnValue(mockCornerstoneStackViewport as unknown as csTypes.IStackViewport);
      jest
        .spyOn(cstSegmentation.state, 'updateLabelmapSegmentationImageReferences')
        .mockReturnValue('labelmapImageId');
      jest.spyOn(cstSegmentation, 'addSegmentationRepresentations').mockReturnValueOnce(undefined);

      await service.addSegmentationRepresentation(viewportId, {
        segmentationId: segmentationId,
        type: csToolsEnums.SegmentationRepresentations.Labelmap,
        config: { blendMode: csEnums.BlendModes.COMPOSITE },
        suppressEvents: true,
      });

      expect(cstSegmentation.addSegmentationRepresentations).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.addSegmentationRepresentations).toHaveBeenCalledWith(viewportId, [
        {
          type: csToolsEnums.SegmentationRepresentations.Labelmap,
          segmentationId: segmentationId,
          config: { colorLUTOrIndex: 1, blendMode: csEnums.BlendModes.COMPOSITE },
        },
      ]);
    });
  });

  describe('getSegmentColor', () => {
    it('should get the color of the segment', () => {
      const viewportId = 'viewportId';
      const segmentationId = 'segmentationId';
      const segmentIndex = 1;
      const color = [255, 0, 0, 255] as csTypes.Color;

      jest.spyOn(cstSegmentation.config.color, 'getSegmentIndexColor').mockReturnValue(color);

      const returnedColor = service.getSegmentColor(viewportId, segmentationId, segmentIndex);

      expect(cstSegmentation.config.color.getSegmentIndexColor).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.config.color.getSegmentIndexColor).toHaveBeenCalledWith(
        viewportId,
        segmentationId,
        segmentIndex
      );

      expect(returnedColor).toEqual(color);
    });
  });

  describe('getLabelmapVolume', () => {
    it('should get the labelmap volume for the segmentation', () => {
      const segmentationId = 'segmentationId';
      const labelmapVolume = { id: 'volumeId' };
      mockCornerstoneSegmentation.representationData.Labelmap = { volumeId: 'volumeId' };
      jest
        .spyOn(cstSegmentation.state, 'getSegmentation')
        .mockReturnValue(mockCornerstoneSegmentation);
      // @ts-expect-error - no need to mock every property for this test
      jest.spyOn(cache, 'getVolume').mockReturnValue(labelmapVolume);

      const returnedLabelmapVolume = service.getLabelmapVolume(segmentationId);

      expect(cstSegmentation.state.getSegmentation).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.state.getSegmentation).toHaveBeenCalledWith(segmentationId);

      expect(cache.getVolume).toHaveBeenCalledTimes(1);
      expect(cache.getVolume).toHaveBeenCalledWith(labelmapVolume.id);

      expect(returnedLabelmapVolume).toEqual(labelmapVolume);

      mockCornerstoneSegmentation.representationData.Labelmap = {};
    });

    it('should return null if the segmentation does not have a labelmap volume', () => {
      const segmentationId = 'segmentationId';
      jest
        .spyOn(cstSegmentation.state, 'getSegmentation')
        .mockReturnValue(mockCornerstoneSegmentation);

      const returnedLabelmapVolume = service.getLabelmapVolume(segmentationId);

      expect(cstSegmentation.state.getSegmentation).toHaveBeenCalledTimes(1);

      expect(returnedLabelmapVolume).toEqual(null);
    });
  });

  describe('setSegmentLabel', () => {
    it('should set the label of the segment', () => {
      const segmentationId = 'segmentationId';
      const segmentIndex = 1;
      const label = 'New Segment 1';

      jest
        .spyOn(cstSegmentation.state, 'getSegmentation')
        .mockReturnValue(mockCornerstoneSegmentation);
      jest.spyOn(cstSegmentation, 'updateSegmentations').mockReturnValue(undefined);

      service.setSegmentLabel(segmentationId, segmentIndex, label);

      expect(cstSegmentation.state.getSegmentation).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.state.getSegmentation).toHaveBeenCalledWith(segmentationId);

      expect(cstSegmentation.updateSegmentations).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.updateSegmentations).toHaveBeenCalledWith([
        {
          segmentationId,
          payload: {
            segments: {
              ...mockCornerstoneSegmentation.segments,
              [segmentIndex]: { ...mockCornerstoneSegmentation.segments[segmentIndex], label },
            },
          },
        },
      ]);
    });
  });

  describe('setActiveSegment', () => {
    it('should set the active segment for the segmentation', () => {
      const segmentationId = 'segmentationId';
      const segmentIndex = 1;

      jest.spyOn(cstSegmentation.segmentIndex, 'setActiveSegmentIndex').mockReturnValue(undefined);

      service.setActiveSegment(segmentationId, segmentIndex);

      expect(cstSegmentation.segmentIndex.setActiveSegmentIndex).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.segmentIndex.setActiveSegmentIndex).toHaveBeenCalledWith(
        segmentationId,
        segmentIndex
      );
    });
  });

  describe('setRenderInactiveSegmentations', () => {
    it('should set the render inactive segmentations for the viewport', () => {
      const viewportId = 'viewportId';
      const renderInactive = true;

      jest
        .spyOn(cstSegmentation.config.style, 'setRenderInactiveSegmentations')
        .mockReturnValue(undefined);

      service.setRenderInactiveSegmentations(viewportId, renderInactive);

      expect(cstSegmentation.config.style.setRenderInactiveSegmentations).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.config.style.setRenderInactiveSegmentations).toHaveBeenCalledWith(
        viewportId,
        renderInactive
      );
    });
  });

  describe('getRenderInactiveSegmentations', () => {
    it('should get the render inactive segmentations for the viewport', () => {
      const viewportId = 'viewportId';
      const renderInactive = true;

      jest
        .spyOn(cstSegmentation.config.style, 'getRenderInactiveSegmentations')
        .mockReturnValue(renderInactive);

      const returnedRenderInactive = service.getRenderInactiveSegmentations(viewportId);

      expect(cstSegmentation.config.style.getRenderInactiveSegmentations).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.config.style.getRenderInactiveSegmentations).toHaveBeenCalledWith(
        viewportId
      );

      expect(returnedRenderInactive).toEqual(renderInactive);
    });
  });

  describe('setSegmentationGroupStats', () => {
    it('should set the segmentation group stats', () => {
      const segmentationIds = ['segmentationId1', 'segmentationId2'];
      const stats = { key: 'value' };

      service.setSegmentationGroupStats(segmentationIds, stats);

      const returnedStats = service.getSegmentationGroupStats(segmentationIds);

      expect(returnedStats).toEqual(stats);
    });
  });

  describe('getSegmentationGroupStats', () => {
    it('should get the segmentation group stats', () => {
      const segmentationIds = ['segmentationId1', 'segmentationId2'];
      const stats = { key: 'value' };

      let returnedStats = service.getSegmentationGroupStats(segmentationIds);

      expect(returnedStats).toEqual(undefined);

      service.setSegmentationGroupStats(segmentationIds, stats);

      returnedStats = service.getSegmentationGroupStats(segmentationIds);

      expect(returnedStats).toEqual(stats);
    });
  });

  describe('toggleSegmentationRepresentationVisibility', () => {
    it('should toggle the visibility of the segmentation representation', () => {
      jest.spyOn(service, 'getSegmentationRepresentations').mockReturnValue(representations);
      jest
        .spyOn(cstSegmentation.config.visibility, 'getHiddenSegmentIndices')
        .mockReturnValue(new Set());
      jest
        .spyOn(cstSegmentation.config.visibility, 'setSegmentationRepresentationVisibility')
        .mockReturnValue(undefined);

      service.toggleSegmentationRepresentationVisibility(viewportId, {
        segmentationId: representations[0].segmentationId,
        type: representations[0].type,
      });

      expect(service.getSegmentationRepresentations).toHaveBeenCalledTimes(1);
      expect(service.getSegmentationRepresentations).toHaveBeenCalledWith(viewportId, {
        segmentationId: representations[0].segmentationId,
        type: representations[0].type,
      });

      expect(cstSegmentation.config.visibility.getHiddenSegmentIndices).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.config.visibility.getHiddenSegmentIndices).toHaveBeenCalledWith(
        viewportId,
        {
          segmentationId: representations[0].segmentationId,
          type: representations[0].type,
        }
      );

      expect(
        cstSegmentation.config.visibility.setSegmentationRepresentationVisibility
      ).toHaveBeenCalledTimes(1);
      expect(
        cstSegmentation.config.visibility.setSegmentationRepresentationVisibility
      ).toHaveBeenCalledWith(
        viewportId,
        {
          segmentationId: representations[0].segmentationId,
          type: representations[0].type,
        },
        false
      );
    });
  });

  describe('setSegmentationRepresentationVisibility', () => {
    it('should early return if the representation is not found', () => {
      jest.spyOn(service, 'getSegmentationRepresentations').mockReturnValueOnce([]);
      jest.spyOn(console, 'debug').mockReturnValue(undefined);
      jest.spyOn(cstSegmentation.config.visibility, 'setSegmentationRepresentationVisibility');

      service['_setSegmentationRepresentationVisibility'](
        viewportId,
        representations[0].segmentationId,
        representations[0].type,
        true
      );

      expect(console.debug).toHaveBeenCalledTimes(1);
      expect(console.debug).toHaveBeenCalledWith(
        'No segmentation representation found for the given viewportId and segmentationId'
      );

      expect(
        cstSegmentation.config.visibility.setSegmentationRepresentationVisibility
      ).not.toHaveBeenCalled();
    });
  });

  describe('getViewportIdsWithSegmentation', () => {
    it('should get the viewport ids with the segmentation', () => {
      const segmentationId = 'segmentationId';
      const viewportIds = ['viewportId1', 'viewportId2'];

      jest
        .spyOn(cstSegmentation.state, 'getViewportIdsWithSegmentation')
        .mockReturnValue(viewportIds);

      const returnedViewportIds = service.getViewportIdsWithSegmentation(segmentationId);

      expect(cstSegmentation.state.getViewportIdsWithSegmentation).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.state.getViewportIdsWithSegmentation).toHaveBeenCalledWith(
        segmentationId
      );

      expect(returnedViewportIds).toEqual(viewportIds);
    });
  });

  describe('clearSegmentationRepresentations', () => {
    it('should clear the segmentation representations', () => {
      const viewportId = 'viewportId';
      jest.spyOn(service, 'removeSegmentationRepresentations').mockReturnValue(undefined);

      service.clearSegmentationRepresentations(viewportId);

      expect(service.removeSegmentationRepresentations).toHaveBeenCalledTimes(1);
      expect(service.removeSegmentationRepresentations).toHaveBeenCalledWith(viewportId);
    });
  });

  describe('remove', () => {
    it('should remove the segmentation', () => {
      const segmentationId = 'segmentationId';

      jest.spyOn(cstSegmentation.state, 'removeSegmentation').mockReturnValue(undefined);

      service.remove(segmentationId);

      expect(cstSegmentation.state.removeSegmentation).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.state.removeSegmentation).toHaveBeenCalledWith(segmentationId);
    });
  });

  describe('removeAllSegmentations', () => {
    it('should remove all segmentations', () => {
      jest.spyOn(cstSegmentation.state, 'removeAllSegmentations').mockReturnValue(undefined);

      service.removeAllSegmentations();

      expect(cstSegmentation.state.removeAllSegmentations).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.state.removeAllSegmentations).toHaveBeenCalledWith();
    });
  });

  describe('removeSegmentationRepresentations', () => {
    it('should remove the segmentation representations', () => {
      const viewportId = 'viewportId';
      const specifier = {
        segmentationId: 'segmentationId',
        type: csToolsEnums.SegmentationRepresentations.Labelmap,
      };
      jest.spyOn(cstSegmentation, 'removeSegmentationRepresentations').mockReturnValue(undefined);

      service.removeSegmentationRepresentations(viewportId, specifier);

      expect(cstSegmentation.removeSegmentationRepresentations).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.removeSegmentationRepresentations).toHaveBeenCalledWith(
        viewportId,
        specifier
      );
    });
  });

  describe('jumpToSegmentCenter', () => {
    it('should early return if the center is not found', () => {
      const segmentationId = 'segmentationId';
      const segmentIndex = 1;

      jest.spyOn(console, 'warn').mockReturnValue(undefined);
      jest.spyOn(cstSegmentation.state, 'getSegmentation').mockReturnValue(null);
      jest.spyOn(service, 'getViewportIdsWithSegmentation');

      service.jumpToSegmentCenter(segmentationId, segmentIndex);

      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        'No center found for segmentation',
        segmentationId,
        segmentIndex
      );

      expect(service.getViewportIdsWithSegmentation).not.toHaveBeenCalled();
    });

    it('should correctly handle scenario where viewportId is provided', () => {
      const segmentationId = 'segmentationId';
      const segmentIndex = 1;
      const viewportId = 'viewportId';
      const viewport = { jumpToWorld: jest.fn() };

      const segmentationWithCenter = {
        ...mockCornerstoneSegmentation,
        segments: {
          ...mockCornerstoneSegmentation.segments,
          [segmentIndex]: {
            ...mockCornerstoneSegmentation.segments[segmentIndex],
            cachedStats: { center: { image: [1, 1, 1], world: [10, 10, 10] } },
          },
        },
      };

      jest.spyOn(cstSegmentation.state, 'getSegmentation').mockReturnValue(segmentationWithCenter);
      jest.spyOn(service, 'getViewportIdsWithSegmentation');
      // @ts-expect-error - mock only needed properties
      getEnabledElementByViewportId.mockReturnValue({ viewport });
      jest.spyOn(service, 'highlightSegment').mockReturnValue(undefined);

      service.jumpToSegmentCenter(segmentationId, segmentIndex, viewportId);

      expect(cstSegmentation.state.getSegmentation).toHaveBeenCalledTimes(1);
      expect(cstSegmentation.state.getSegmentation).toHaveBeenCalledWith(segmentationId);

      expect(service.getViewportIdsWithSegmentation).not.toHaveBeenCalled();

      expect(viewport.jumpToWorld).toHaveBeenCalledTimes(1);
      expect(viewport.jumpToWorld).toHaveBeenCalledWith([10, 10, 10]);

      expect(service.highlightSegment).toHaveBeenCalledTimes(1);
      expect(service.highlightSegment).toHaveBeenCalledWith(
        segmentationId,
        segmentIndex,
        viewportId,
        0.9,
        750,
        false,
        EasingFunctionEnum.EASE_IN_OUT
      );
    });

    it('should correctly handle custom animation parameters', () => {
      const segmentationId = 'segmentationId';
      const segmentIndex = 1;
      const viewportId = 'viewportId';
      const viewport = { jumpToWorld: jest.fn() };

      const segmentationWithNamedStatsCenter = {
        ...mockCornerstoneSegmentation,
        segments: {
          ...mockCornerstoneSegmentation.segments,
          [segmentIndex]: {
            ...mockCornerstoneSegmentation.segments[segmentIndex],
            cachedStats: {
              namedStats: { center: { value: [1, 1, 1] } },
            },
          },
        },
      };

      jest
        .spyOn(cstSegmentation.state, 'getSegmentation')
        .mockReturnValue(segmentationWithNamedStatsCenter);
      jest.spyOn(service, 'getViewportIdsWithSegmentation').mockReturnValue([viewportId]);
      // @ts-expect-error - mock only needed properties
      getEnabledElementByViewportId.mockReturnValue({ viewport });
      jest.spyOn(service, 'highlightSegment').mockReturnValue(undefined);

      service.jumpToSegmentCenter(
        segmentationId,
        segmentIndex,
        undefined,
        0.8,
        true,
        800,
        false,
        EasingFunctionEnum.LINEAR
      );

      expect(service.getViewportIdsWithSegmentation).toHaveBeenCalledTimes(1);
      expect(service.getViewportIdsWithSegmentation).toHaveBeenCalledWith(segmentationId);

      expect(viewport.jumpToWorld).toHaveBeenCalledTimes(1);
      expect(viewport.jumpToWorld).toHaveBeenCalledWith([1, 1, 1]);

      expect(service.highlightSegment).toHaveBeenCalledTimes(1);
      expect(service.highlightSegment).toHaveBeenCalledWith(
        segmentationId,
        segmentIndex,
        viewportId,
        0.8,
        800,
        false,
        EasingFunctionEnum.LINEAR
      );
    });
  });

  describe('highlightSegment', () => {
    describe('LABELMAP Segmentation', () => {
      it('should correctly handle scenario where viewportId is provided', () => {
        const segmentIndex = 1;
        const viewportId = 'viewportId';
        const initialFillAlpha = 0.3;
        const animationDuration = 750;
        const animationFunctionConstant = 0.85;
        const easingFunction = jest.fn(() => animationFunctionConstant);

        jest
          .spyOn(cstSegmentation.state, 'getSegmentation')
          .mockReturnValue(mockCornerstoneSegmentation);
        jest.spyOn(service, 'getViewportIdsWithSegmentation');
        jest.spyOn(service, 'getSegmentationRepresentations').mockReturnValue(representations);
        jest.spyOn(cstSegmentation.config.style, 'getStyle').mockReturnValue({
          fillAlpha: initialFillAlpha,
        });
        jest.spyOn(window, 'requestAnimationFrame').mockReturnValue(undefined);
        jest.spyOn(EasingFunctionMap, 'get').mockReturnValue(easingFunction);

        service.highlightSegment(
          representations[0].segmentationId,
          segmentIndex,
          viewportId,
          0.9,
          animationDuration,
          false,
          EasingFunctionEnum.EASE_IN_OUT
        );

        expect(cstSegmentation.state.getSegmentation).toHaveBeenCalledTimes(1);
        expect(cstSegmentation.state.getSegmentation).toHaveBeenCalledWith(
          representations[0].segmentationId
        );

        expect(service.getViewportIdsWithSegmentation).not.toHaveBeenCalled();

        expect(service.getSegmentationRepresentations).toHaveBeenCalledTimes(1);
        expect(service.getSegmentationRepresentations).toHaveBeenCalledWith(viewportId, {
          segmentationId: representations[0].segmentationId,
        });

        expect(cstSegmentation.config.style.getStyle).toHaveBeenCalledTimes(1);
        expect(cstSegmentation.config.style.getStyle).toHaveBeenCalledWith({
          viewportId,
          segmentationId: representations[0].segmentationId,
          type: csToolsEnums.SegmentationRepresentations.Labelmap,
          segmentIndex,
        });

        expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
        expect(window.requestAnimationFrame).toHaveBeenCalledWith(expect.any(Function));

        const animationCallback = jest.mocked(window.requestAnimationFrame).mock.calls[0][0];

        // during animation call
        animationCallback(0);

        expect(EasingFunctionMap.get).toHaveBeenCalledTimes(1);
        expect(EasingFunctionMap.get).toHaveBeenCalledWith(EasingFunctionEnum.EASE_IN_OUT);

        expect(cstSegmentation.config.style.setStyle).toHaveBeenCalledTimes(1);
        expect(cstSegmentation.config.style.setStyle).toHaveBeenCalledWith(
          {
            segmentationId: representations[0].segmentationId,
            segmentIndex,
            type: csToolsEnums.SegmentationRepresentations.Labelmap,
          },
          {
            fillAlpha: animationFunctionConstant,
          }
        );

        expect(easingFunction).toHaveBeenCalledTimes(1);
        expect(easingFunction).toHaveBeenCalledWith(0, initialFillAlpha);

        expect(window.requestAnimationFrame).toHaveBeenCalledTimes(2);
        expect(window.requestAnimationFrame).toHaveBeenCalledWith(expect.any(Function));

        // end of animation call
        animationCallback(animationDuration);

        expect(cstSegmentation.config.style.setStyle).toHaveBeenCalledTimes(3);
        expect(cstSegmentation.config.style.setStyle).toHaveBeenCalledWith(
          {
            segmentationId: representations[0].segmentationId,
            segmentIndex,
            type: csToolsEnums.SegmentationRepresentations.Labelmap,
          },
          {},
          false
        );

        expect(window.requestAnimationFrame).not.toHaveBeenCalledTimes(3);
      });

      it('should throw if hideOthers is true', () => {
        const segmentIndex = 1;

        jest.spyOn(window, 'clearInterval').mockReturnValue(undefined);
        jest
          .spyOn(cstSegmentation.state, 'getSegmentation')
          .mockReturnValue(mockCornerstoneSegmentation);
        jest.spyOn(service, 'getViewportIdsWithSegmentation').mockReturnValue([viewportId]);
        jest.spyOn(service, 'getSegmentationRepresentations').mockReturnValue(representations);

        expect(() =>
          service.highlightSegment(representations[0].segmentationId, segmentIndex)
        ).toThrow('hideOthers is not working right now');

        expect(window.clearInterval).not.toHaveBeenCalled();

        expect(service.getViewportIdsWithSegmentation).toHaveBeenCalledTimes(1);
        expect(service.getViewportIdsWithSegmentation).toHaveBeenCalledWith(
          representations[0].segmentationId
        );

        expect(service.getSegmentationRepresentations).toHaveBeenCalledTimes(1);
        expect(service.getSegmentationRepresentations).toHaveBeenCalledWith(viewportId, {
          segmentationId: representations[0].segmentationId,
        });
      });
    });

    describe('CONTOUR Segmentation', () => {
      it('should correctly handle scenario where viewportId is provided', () => {
        const segmentIndex = 1;
        const viewportId = 'viewportId';
        const initialOutlineWidth = 3;
        const animationDuration = 750;
        const animationFunctionConstant = 5;
        const easingFunction = jest.fn(() => animationFunctionConstant);

        const contourRepresentations = [
          {
            ...representations[0],
            type: csToolsEnums.SegmentationRepresentations.Contour,
          },
        ];

        jest
          .spyOn(cstSegmentation.state, 'getSegmentation')
          .mockReturnValue(mockCornerstoneSegmentation);
        jest.spyOn(service, 'getViewportIdsWithSegmentation');
        jest
          .spyOn(service, 'getSegmentationRepresentations')
          .mockReturnValue(contourRepresentations);
        jest.spyOn(cstSegmentation.config.style, 'getStyle').mockReturnValue({
          outlineWidth: initialOutlineWidth,
        });
        jest.spyOn(window, 'requestAnimationFrame').mockReturnValue(undefined);
        jest.spyOn(EasingFunctionMap, 'get').mockReturnValue(easingFunction);
        jest.spyOn(cstSegmentation.config.style, 'resetToGlobalStyle').mockReturnValue(undefined);

        service.highlightSegment(
          contourRepresentations[0].segmentationId,
          segmentIndex,
          viewportId,
          0.9,
          animationDuration,
          false,
          EasingFunctionEnum.LINEAR
        );

        expect(service.getViewportIdsWithSegmentation).not.toHaveBeenCalled();

        expect(cstSegmentation.config.style.getStyle).toHaveBeenCalledTimes(1);
        expect(cstSegmentation.config.style.getStyle).toHaveBeenCalledWith({
          type: csToolsEnums.SegmentationRepresentations.Contour,
        });

        expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
        expect(window.requestAnimationFrame).toHaveBeenCalledWith(expect.any(Function));

        const animationCallback = jest.mocked(window.requestAnimationFrame).mock.calls[0][0];
        const approximateStartTime = performance.now();

        // during animation call
        animationCallback(approximateStartTime + 200);

        expect(EasingFunctionMap.get).toHaveBeenCalledTimes(1);
        expect(EasingFunctionMap.get).toHaveBeenCalledWith(EasingFunctionEnum.LINEAR);

        expect(cstSegmentation.config.style.setStyle).toHaveBeenCalledTimes(1);
        expect(cstSegmentation.config.style.setStyle).toHaveBeenCalledWith(
          {
            segmentationId: contourRepresentations[0].segmentationId,
            segmentIndex,
            type: csToolsEnums.SegmentationRepresentations.Contour,
          },
          {
            outlineWidth: animationFunctionConstant,
          }
        );

        expect(easingFunction).toHaveBeenCalledTimes(1);
        expect(easingFunction).toHaveBeenCalledWith(expect.any(Number), initialOutlineWidth, 5);

        expect(window.requestAnimationFrame).toHaveBeenCalledTimes(2);
        expect(window.requestAnimationFrame).toHaveBeenCalledWith(expect.any(Function));

        // end of animation call
        animationCallback(approximateStartTime + animationDuration);

        expect(cstSegmentation.config.style.setStyle).toHaveBeenCalledTimes(1);

        expect(cstSegmentation.config.style.resetToGlobalStyle).toHaveBeenCalledTimes(1);
        expect(cstSegmentation.config.style.resetToGlobalStyle).toHaveBeenCalledWith();

        expect(window.requestAnimationFrame).not.toHaveBeenCalledTimes(3);
      });
    });

    it('should clear interval if it exists', () => {
      expect(service.highlightIntervalId).toBe(null);

      service.highlightIntervalId = 'intervalId';

      jest
        .spyOn(cstSegmentation.state, 'getSegmentation')
        .mockReturnValue(mockCornerstoneSegmentation);
      jest.spyOn(service, 'getViewportIdsWithSegmentation');
      jest.spyOn(service, 'getSegmentationRepresentations').mockReturnValue(representations);
      jest.spyOn(cstSegmentation.config.style, 'getStyle').mockReturnValue({
        fillAlpha: 0.3,
      });
      jest.spyOn(window, 'requestAnimationFrame').mockReturnValue(undefined);
      jest.spyOn(window, 'clearInterval').mockReturnValue(undefined);

      service.highlightSegment(representations[0].segmentationId, 1, viewportId, 0.9, 750, false);

      expect(window.clearInterval).toHaveBeenCalledTimes(1);
      expect(window.clearInterval).toHaveBeenCalledWith('intervalId');
    });
  });

  describe('_onSegmentationDataModifiedFromSource', () => {
    it('should broadcast the event', () => {
      jest.spyOn(eventTarget, 'addEventListener').mockReturnValue(undefined);

      const callback = jest.fn();
      service.subscribe(service.EVENTS.SEGMENTATION_DATA_MODIFIED, callback);

      service.onModeEnter();

      const _onSegmentationDataModifiedFromSource = jest.mocked(eventTarget.addEventListener).mock
        .calls[2][1];

      _onSegmentationDataModifiedFromSource({
        detail: {
          segmentationId: 'segmentationId',
        },
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        segmentationId: 'segmentationId',
      });
    });
  });

  describe('_onSegmentationRepresentationModifiedFromSource', () => {
    it('should broadcast the event', () => {
      jest.spyOn(eventTarget, 'addEventListener').mockReturnValue(undefined);

      const callback = jest.fn();
      service.subscribe(service.EVENTS.SEGMENTATION_REPRESENTATION_MODIFIED, callback);

      service.onModeEnter();

      const _onSegmentationRepresentationModifiedFromSource = jest.mocked(
        eventTarget.addEventListener
      ).mock.calls[3][1];

      _onSegmentationRepresentationModifiedFromSource({
        detail: {
          segmentationId: 'segmentationId',
          viewportId: 'viewportId',
        },
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        segmentationId: 'segmentationId',
        viewportId: 'viewportId',
      });
    });
  });

  describe('_onSegmentationModifiedFromSource', () => {
    it('should broadcast the event', () => {
      jest.spyOn(eventTarget, 'addEventListener').mockReturnValue(undefined);

      const callback = jest.fn();
      service.subscribe(service.EVENTS.SEGMENTATION_MODIFIED, callback);

      service.onModeEnter();

      const _onSegmentationModifiedFromSource = jest.mocked(eventTarget.addEventListener).mock
        .calls[0][1];

      _onSegmentationModifiedFromSource({
        detail: {
          segmentationId: 'segmentationId',
        },
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        segmentationId: 'segmentationId',
      });
    });
  });

  describe('_onSegmentationAddedFromSource', () => {
    it('should broadcast the event', () => {
      jest.spyOn(eventTarget, 'addEventListener').mockReturnValue(undefined);

      const callback = jest.fn();
      service.subscribe(service.EVENTS.SEGMENTATION_ADDED, callback);

      service.onModeEnter();

      const _onSegmentationAddedFromSource = jest.mocked(eventTarget.addEventListener).mock
        .calls[6][1];

      _onSegmentationAddedFromSource({
        detail: {
          segmentationId: 'segmentationId',
        },
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        segmentationId: 'segmentationId',
      });
    });
  });
});
