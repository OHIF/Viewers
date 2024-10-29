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
        MeasurementService,
        ViewportGridService,
        CornerstoneViewportService,
        UINotificationService,
        LayoutService,
        PanelService,
      } = servicesManager.services;

      console.log('MeasurementService:', MeasurementService.EVENTS);
      console.log('ViewportGridService:', ViewportGridService);
      console.log('CornerstoneViewportService:', CornerstoneViewportService);
      console.log('UINotificationService:', UINotificationService);
      console.log('PanelService:', PanelService);
      if (!MeasurementService || !ViewportGridService || !CornerstoneViewportService) {
        console.error('Required services are not available');
        return;
      }

      window.addEventListener('message', event => {
        if (event.data.type === 'POINTS_UPDATED') {
          console.log('Points updated:', event.data.points);
          // Update measurements based on points
          demonstrateMeasurementService(servicesManager);
        }
      });

      // permet de capturer les changements de viewport et de déclencher la fonction demonstrateMeasurementService
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
        console.log('ADDING NEW POINTS', event);
        const viewportId = viewportGridService.getActiveViewportId();
        const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
        const imageId = viewport.getCurrentImageId();
        const imageMetadata = viewport.getImageData(imageId);

        const newPoints = [];

        event.measurement.points.forEach(point =>
          newPoints.push(NormalizeDicomCoordinates(imageMetadata.direction, point))
        );

        console.log('ADDING', newPoints);
        if (newPoints) {
          window.parent.postMessage(
            {
              type: 'send_points_to_front',
              message: {
                points: newPoints,
                elementType: event.measurement.toolName,
              },
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
