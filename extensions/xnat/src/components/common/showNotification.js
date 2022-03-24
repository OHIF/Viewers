// import { servicesManager } from '@ohif/viewer/src/App';

const showNotification = (message, type, title = '') => {
  const servicesManager = window.ohif.app.servicesManager;
  const { UINotificationService } = servicesManager.services;

  if (UINotificationService) {
    UINotificationService.show({
      title: title,
      message: message,
      type: type,
    });
  }
};

export default showNotification;
