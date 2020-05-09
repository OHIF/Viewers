import React from 'react';
import {
  HelloWorldContext,
  AnotherHelloWorldContext,
} from './getContextModule';

function helloWorldComponent({}) {
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
