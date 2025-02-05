import panelMeasurementItem from './customizations/panelMeasurementItem';

export default function getCustomizationModule() {
  return [
    {
      name: 'default',
      value: {
        ...panelMeasurementItem,
      },
    },
  ];
}
