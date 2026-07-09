import measurementTrackingPrompts from './customizations/measurementTrackingPrompts';

export default function getCustomizationModule() {
  return [
    {
      name: 'default',
      value: { ...measurementTrackingPrompts },
    },
  ];
}
