import { demonstrateMeasurementService, createMeasurement } from './utils/measurementUtils';
import { OHIFMessageType } from './utils/enums';

const commandsModule = ({ servicesManager }) => {
  const actions = {
    demonstrateMeasurementService: () => {
      const { measurementService, ViewportGridService, CornerstoneViewportService } =
        servicesManager.services;

      if (!measurementService || !ViewportGridService || !CornerstoneViewportService) {
        console.error('Required services are not available');
        return;
      }

      CornerstoneViewportService.subscribe(
        CornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED,
        () => {
          window.parent.postMessage(
            {
              type: OHIFMessageType.IMAGE_READY,
            },
            '*'
          );
        }
      );

      window.addEventListener('message', event => {
        if (event.data.type === OHIFMessageType.SEND_MEASURE) {
          const relatedPoints = event.data.message;
          demonstrateMeasurementService(servicesManager, relatedPoints);
          const viewportId = ViewportGridService.getActiveViewportId();
          const viewport = CornerstoneViewportService.getCornerstoneViewport(viewportId);
          const imageId = viewport.getCurrentImageId();
          const imageMetadata = viewport.getImageData(imageId);

          const imageWidth = imageMetadata.dimensions[0];
          const imageHeight = imageMetadata.dimensions[1];

          window.parent.postMessage(
            {
              type: OHIFMessageType.IMAGE_SIZE,
              message: {
                width: imageWidth,
                height: imageHeight,
              },
            },
            '*'
          );
        }
      });
    },
    linkMeasurement: info => {
      window.parent.postMessage(
        {
          type: OHIFMessageType.LINK_MEASURE,
          message: {
            elementType: info.toolName,
            uid: info.uid,
          },
        },
        '*'
      );
    },
    createForms: () => {
      const { measurementService } = servicesManager.services;

      measurementService.subscribe(measurementService.EVENTS.MEASUREMENT_ADDED, async event => {
        if (event.measurement.points) {
          const normalizedPoints = await createMeasurement(
            servicesManager,
            event.measurement.points
          );
          window.parent.postMessage(
            {
              type: OHIFMessageType.CREATE_MEASURE,
              message: {
                points: normalizedPoints,
                elementType: event.measurement.toolName,
                uid: event.measurement.uid,
              },
            },
            '*'
          );
        }
      });

      let dataToSend = [];
      measurementService.subscribe(measurementService.EVENTS.MEASUREMENT_UPDATED, async event => {
        const normalizedPoints = await createMeasurement(servicesManager, event.measurement.points);
        const matchedPoints = [];
        if (event?.measurement?.label?.predicted) {
          event?.measurement?.label.pointsInfo.forEach((point, index) => {
            matchedPoints.push({
              ...point,
              x: normalizedPoints[index][0],
              y: normalizedPoints[index][1],
            });
          });
        } else {
          event.measurement.points.forEach((point, index) => {
            matchedPoints.push({
              x: normalizedPoints[index][0],
              y: normalizedPoints[index][1],
            });
          });
        }

        dataToSend = {
          points: matchedPoints,
          elementType: event.measurement.toolName,
          uid: event.measurement.uid,
          measurementId: event?.measurement?.label.measurementId,
          hide: event?.measurement?.label?.hide,
        };

        if (normalizedPoints) {
          window.parent.postMessage(
            {
              type: OHIFMessageType.UPDATE_MEASURE,
              message: dataToSend,
            },
            '*'
          );
        }
      });
    },
    deleteMeasurement: ({ uid }) => {
      if (uid) {
        const { measurementService } = servicesManager.services;
        measurementService.remove(uid);

        window.parent.postMessage(
          {
            type: OHIFMessageType.DELETE_MEASURE,
            message: { uid },
          },
          '*'
        );
      }
    },
    resetPoints: () => {
      const { measurementService } = servicesManager.services;
      window.parent.postMessage(
        {
          type: OHIFMessageType.RESET_POINTS,
        },
        '*'
      );
      measurementService.clearMeasurements();
    },
  };

  return {
    definitions: {
      demonstrateMeasurementService: {
        commandFn: actions.demonstrateMeasurementService,
        storeContexts: ['viewports'],
        options: {},
      },
      createForms: {
        commandFn: actions.createForms,
      },
      linkMeasurement: {
        commandFn: actions.linkMeasurement,
      },
      deleteMeasurement: {
        commandFn: actions.deleteMeasurement,
      },
      resetPoints: {
        commandFn: actions.resetPoints,
      },
    },
    defaultContext: 'VIEWER',
  };
};

export default commandsModule;
