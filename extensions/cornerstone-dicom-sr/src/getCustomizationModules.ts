import viewportButtons from './customizations/viewportButtons';

function getCustomizationModule() {
  return [
    {
      name: 'default',
      value: {
        ...viewportButtons,
      },
    },
  ];
}

export default getCustomizationModule;
