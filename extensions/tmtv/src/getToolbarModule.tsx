import RectangleROIOptions from './Panels/RectangleROIOptions';

export default function getToolbarModule({ commandsManager, servicesManager }) {
  return [
    {
      name: 'tmtv.RectangleROIThresholdOptions',
      defaultComponent: () => RectangleROIOptions({ commandsManager, servicesManager }),
    },
  ];
}
