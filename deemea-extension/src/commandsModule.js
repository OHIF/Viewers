import { demonstrateMeasurementService } from './utils/measurementUtils';

const commandsModule = ({ servicesManager }) => {
  const actions = {
    demonstrateMeasurementService: () => {
      const { MeasurementService, ViewportGridService, CornerstoneViewportService, UINotificationService } = servicesManager.services;

      if (!MeasurementService || !ViewportGridService || !CornerstoneViewportService) {
        console.error('Required services are not available');
        return;
      }

      // Solution 1: Ajouter un délai
      setTimeout(() => {
        demonstrateMeasurementService(servicesManager);
      }, 2000); // Augmenté à 2 secondes

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