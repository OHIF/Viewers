import segmentationCustomization from './customizations/segmentationCustomization';

export default function getCustomizationModule() {
  return [
    {
      name: 'default',
      value: segmentationCustomization,
    },
  ];
}
