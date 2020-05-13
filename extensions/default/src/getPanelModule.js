import React from 'react';
import {
  HelloWorldContext,
  AnotherHelloWorldContext,
} from './getContextModule';

import { useViewModel, displaySetManager } from '@ohif/core';

function helloWorldComponent({}) {
  const viewModel = useViewModel();

  console.log(viewModel);

  viewModel.displaySetInstanceUids.forEach(uid => {
    console.log(displaySetManager.getDisplaySetByUID(uid));
  });

  debugger;

  return (
    <HelloWorldContext.Consumer>
      {value => (
        <div>
          <h2 style={{ color: 'white' }}>
            {'Hello world. Context value:'}
            {JSON.stringify(value)}
          </h2>
        </div>
      )}
    </HelloWorldContext.Consumer>
  );
}

function getPanelModule() {
  return [
    {
      name: 'seriesList',
      iconName: 'group-layers',
      iconLabel: 'Studies',
      label: 'Studies',
      component: helloWorldComponent,
    },
    {
      name: 'measure',
      iconName: 'list-bullets',
      iconLabel: 'Measure',
      label: 'Measurements',
      component: helloWorldComponent,
    },
  ];
}

export default getPanelModule;
