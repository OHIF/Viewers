import { OHIFMessageType } from './utils/enums';
import { demonstrateMeasurementService, createMeasurement } from './utils/measurementUtils';

const commandsModule = ({ servicesManager }) => {
  const actions = {
    demonstrateMeasurementService: () => {
      const {
        measurementService,
        ViewportGridService,
        CornerstoneViewportService,
        UINotificationService,
      } = servicesManager.services;

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
          const relatedPoints = event.data.points;
          // Update measurements based on points
          demonstrateMeasurementService(servicesManager, relatedPoints);
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
        const newPoints = [];

        event.measurement.points.forEach(point => newPoints.push(point));

        if (newPoints) {
          const normalizedPoints = await createMeasurement(servicesManager, newPoints);
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
        const updatedPoints = [];
        event.measurement.points.forEach(point => updatedPoints.push(point));

        const normalizedPoints = await createMeasurement(servicesManager, updatedPoints);
        dataToSend = {
          points: normalizedPoints,
          pointIds: event?.measurement?.label.pointIds,
          elementType: event.measurement.toolName,
          uid: event.measurement.uid,
          measurementId: event?.measurement?.label.measurementId,
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
    },
    defaultContext: 'VIEWER',
  };
};

export default commandsModule;
