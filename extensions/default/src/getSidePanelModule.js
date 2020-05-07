import React from 'react';

function helloWorldComponent() {
  return <div>{'Hello world'}</div>;
}

function getSidePanelModule() {
  return [
    {
      name: 'org.ohif.defaults.seriesList',
      component: helloWorldComponent,
    },
    {
      name: 'org.ohif.defaults.measure',
      component: helloWorldComponent,
    },
  ];
}

export default getSidePanelModule;
