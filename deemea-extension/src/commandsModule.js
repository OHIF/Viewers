import { demonstrateMeasurementService } from './utils/measurementUtils';

function NormalizeDicomCoordinates(matrix, coords) {
  let result = [];

  result[0] = matrix[0] * coords[0] + matrix[1] * coords[1] + matrix[2] * coords[2]; // X'
  result[1] = matrix[3] * coords[0] + matrix[4] * coords[1] + matrix[5] * coords[2]; // Y'
  result[2] = matrix[6] * coords[0] + matrix[7] * coords[1] + matrix[8] * coords[2]; // Z'

  return result;
}

const commandsModule = ({ servicesManager }) => {
  const actions = {
    demonstrateMeasurementService: () => {
      const {
        measurementService,
        ViewportGridService,
        CornerstoneViewportService,
        UINotificationService,
        PanelService,
      } = servicesManager.services;

      if (!measurementService || !ViewportGridService || !CornerstoneViewportService) {
        console.error('Required services are not available');
        return;
      }

      window.addEventListener('message', event => {
        if (event.data.type === 'POINTS_UPDATED') {
          const relatedPoints = event.data.points;
          console.log('Points updated:', relatedPoints);
          // Update measurements based on points
          // demonstrateMeasurementService(servicesManager, event.data.points);
          CornerstoneViewportService.subscribe(
            CornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED,
            event => {
              console.log('Viewport data changed:', event);
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
        event => {
          console.log('Viewport data changed:', event);
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
      const { measurementService, viewportGridService, cornerstoneViewportService } =
        servicesManager.services;

      measurementService.subscribe(measurementService.EVENTS.MEASUREMENT_ADDED, event => {
        const viewportId = viewportGridService.getActiveViewportId();
        const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
        const imageId = viewport.getCurrentImageId();
        const imageMetadata = viewport.getImageData(imageId);

        console.log('event', event.measurement.points);

        const newPoints = [];

        event.measurement.points.forEach(point =>
          newPoints.push(NormalizeDicomCoordinates(imageMetadata.direction, point))
        );

        console.log('ADDING', newPoints);
        if (newPoints) {
          window.parent.postMessage(
            {
              type: 'create_measure',
              message: {
                points: newPoints,
                elementType: event.measurement.toolName,
                uid: event.measurement.uid,
              },
            },
            '*'
          );
        }
      });

      let dataToSend = [];
      measurementService.subscribe(measurementService.EVENTS.MEASUREMENT_UPDATED, event => {
        const viewportId = viewportGridService.getActiveViewportId();
        const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
        const imageId = viewport.getCurrentImageId();
        const imageMetadata = viewport.getImageData(imageId);

        const updatedPoints = [];
        event.measurement.points.forEach(point =>
          updatedPoints.push(NormalizeDicomCoordinates(imageMetadata.direction, point))
        );

        dataToSend = {
          points: updatedPoints,
          elementType: event.measurement.toolName,
          uid: event.measurement.uid,
        };

        if (updatedPoints) {
          window.parent.postMessage(
            {
              type: 'update_measure',
              message: dataToSend,
            },
            '*'
          );
        }
        console.log('send points ', dataToSend);
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
