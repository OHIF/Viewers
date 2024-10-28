import { demonstrateMeasurementService } from './utils/measurementUtils';

const commandsModule = ({ servicesManager }) => {
  const actions = {
    demonstrateMeasurementService: () => {
      const { MeasurementService, ViewportGridService, CornerstoneViewportService, UINotificationService, LayoutService, PanelService } = servicesManager.services;

      console.log('MeasurementService:', MeasurementService.EVENTS);
      console.log('ViewportGridService:', ViewportGridService);
      console.log('CornerstoneViewportService:', CornerstoneViewportService);
      console.log('UINotificationService:', UINotificationService);
      console.log('PanelService:', PanelService);
      if (!MeasurementService || !ViewportGridService || !CornerstoneViewportService) {
        console.error('Required services are not available');
        return;
      }

      window.addEventListener('message', (event) => {
        if (event.data.type === 'POINTS_UPDATED') {
          console.log('Points updated:', event.data.points);
          // Update measurements based on points
          demonstrateMeasurementService(servicesManager);
        }
      });



      // permet de capturer les changements de viewport et de déclencher la fonction demonstrateMeasurementService
      CornerstoneViewportService.subscribe(CornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED, (event) => {
        console.log('Viewport data changed:', event);
        demonstrateMeasurementService(servicesManager);
      });

    
      UINotificationService.show({
        title: 'Measurement Service',
        message: 'Demonstrating Measurement Service functionality...',
        type: 'info',
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
    },
    defaultContext: 'VIEWER',
  };
};

export default commandsModule;