import measurementTrackingPrompts from './customizations/measurementTrackingPrompts';

export default function getCustomizationModule() {
  return [
    {
      name: 'default',
      value: {
        ...measurementTrackingPrompts,

        // Panel lists resolved by the longitudinal mode's layout template;
        // `?customization=` modules can replace them (e.g. to swap in the
        // segmentation panels with editing tools).
        'longitudinal.leftPanels': [
          '@ohif/extension-measurement-tracking.panelModule.seriesList',
        ],
        'longitudinal.rightPanels': [
          '@ohif/extension-cornerstone.panelModule.panelSegmentation',
          '@ohif/extension-measurement-tracking.panelModule.trackedMeasurements',
        ],
      },
    },
  ];
}
