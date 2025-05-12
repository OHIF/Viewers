export default function getCommandsModule({ servicesManager }) {
  const { uiNotificationService } = servicesManager.services;

  const actions = {
    setToolActive: ({ toolName }) => {
      uiNotificationService.show({
        title: 'MONAI Label probe',
        message: 'MONAI Label Probe Activated.',
        type: 'info',
        duration: 3000,
      });
    },
  };

  const definitions = {
  };

  return {
    actions,
    definitions,
    defaultContext: 'MONAILabel',
  };
}
