import { cache, eventTarget, Enums as csEnums, Types as csTypes } from '@cornerstonejs/core';
import { ViewportType } from '@cornerstonejs/core/enums';

import {
  Enums as csToolsEnums,
  segmentation as cstSegmentation,
  Types as cstTypes,
} from '@cornerstonejs/tools';

jest.mock('@cornerstonejs/core', () => ({
  ...jest.requireActual('@cornerstonejs/core'),
  eventTarget: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
}));

jest.mock('@cornerstonejs/tools', () => ({
  ...jest.requireActual('@cornerstonejs/tools'),
  segmentation: {
    ...jest.requireActual('@cornerstonejs/tools').segmentation,
    getLabelmapImageIds: jest.fn(),
    helpers: { convertStackToVolumeLabelmap: jest.fn() },
    state: {
      getSegmentation: jest.fn(),
      getSegmentations: jest.fn(),
      getSegmentationRepresentationsBySegmentationId: jest.fn(),
      getSegmentationRepresentations: jest.fn(),
      updateLabelmapSegmentationImageReferences: jest.fn(),
    },
    triggerSegmentationEvents: { triggerSegmentationRepresentationModified: jest.fn() },
  },
}));

import SegmentationService from './SegmentationService';
import SegmentationServiceClass from './SegmentationService';

const serviceManagerMock = {
  services: {
    cornerstoneViewportService: {
      getCornerstoneViewport: jest.fn(),
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
  let service: SegmentationService;
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

  beforeEach(() => {
    service = new SegmentationServiceClass({ servicesManager: serviceManagerMock });

    jest.clearAllMocks();
  });

  it('should instantiate the service properly', () => {
    expect(service).toBeDefined();
    expect(service.servicesManager).toBe(serviceManagerMock);
    expect(service.EVENTS).toBeDefined();
  });

  describe('onModeEnter', () => {
    it('should add event listeners', () => {
      service.onModeEnter();

      expect(eventTarget.addEventListener).toHaveBeenCalledTimes(7);

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
        // @ts-ignore - getLabelmapImageIds is wrongly typed at cornerstone3D
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
        // @ts-ignore - getLabelmapImageIds is wrongly typed at cornerstone3D
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

      const callback = jest.fn();
      service.subscribe(service.EVENTS.SEGMENTATION_REPRESENTATION_MODIFIED, callback);

      service.addSegmentationRepresentation(viewportId, {
        segmentationId: mockCornerstoneSegmentation.segmentationId,
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('createLabelmapForDisplaySet', () => {});
});
