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

      window.addEventListener('message', event => {
        if (event.data.type === 'POINTS_UPDATED') {
          const relatedPoints = event.data.points;
          // Update measurements based on points
          // demonstrateMeasurementService(servicesManager, event.data.points);
          CornerstoneViewportService.subscribe(
            CornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED,
            () => {
              demonstrateMeasurementService(servicesManager, relatedPoints);
              measurementService.removeAll();
            }
          );
        }

        if (event.data.type === 'remove_measure') {
          console.log('here', event.data);
          measurementService.remove(event.data.message.uid);
        }
      });

      CornerstoneViewportService.subscribe(
        CornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED,
        () => {
          demonstrateMeasurementService(servicesManager);
        }
      );

      UINotificationService.show({
        title: 'Measurement Service',
        message: 'Demonstrating Measurement Service functionality...',
        type: 'info',
      });
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
              type: 'create_measure',
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
          elementType: event.measurement.toolName,
          uid: event.measurement.uid,
        };

        if (normalizedPoints) {
          window.parent.postMessage(
            {
              type: 'update_measure',
              message: dataToSend,
            },
            '*'
          );
        }
      });
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
    },
    defaultContext: 'VIEWER',
  };
};

export default commandsModule;
