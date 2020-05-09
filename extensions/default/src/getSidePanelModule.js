import React from 'react';

function helloWorldComponent() {
  return <div>{'Hello world'}</div>;
}

function getSidePanelModule() {
  return [
    {
      name: 'org.ohif.defaults.seriesList',
      iconName: 'group-layers',
      iconLabel: 'Studies',
      label: 'Studies',
      component: helloWorldComponent,
    },
    {
      name: 'org.ohif.defaults.measure',
      iconName: 'list-bullets',
      iconLabel: 'Measure',
      label: 'Measurements',
      component: helloWorldComponent,
    },
  ];
}

export default getSidePanelModule;
