import thumbnailCustomization from './customizations/thumbnailCustomization';

export default function getCustomizationModule() {
  return [
    {
      name: 'default',
      value: {
        ...thumbnailCustomization,
        // Future SignalPET customizations will go here
      },
    },
  ];
}
