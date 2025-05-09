import RectangleROIOptions from './Panels/RectangleROIOptions';

export default function getToolbarModule() {
  return [
    {
      name: 'tmtv.RectangleROIThresholdOptions',
      defaultComponent: RectangleROIOptions,
    },
  ];
}
