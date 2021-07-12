import ImageSet from '@ohif/core/src/classes/ImageSet';
import { IWebApiDataSource } from '@ohif/core';
import React from 'react';
import ReactDOM from 'react-dom';
import { data } from 'autoprefixer';

/**
 *
 */
export default {
  id: 'org.ohif.dicom-pr',

  /**
   * LIFECYCLE HOOKS
   */
  preRegistration({ hotkeysManager, servicesManager }) {
    hotkeysManager.setHotkeys([
      { commandName: 'exampleActionDef', label: 'Example', keys: ['w'] },
    ]);
    const { ConfigPointService } = servicesManager.services;
    const studyListPaginationConfig = ConfigPointService.addLevel("StudyListPagination");
    studyListPaginationConfig.extendLevel("demo", { ranges: [null, { label: 'Fifty' }, null, { value: 10, label: 'ten' }] });
  },
  beforeExtInit() { },
  beforeExtDestroy() { },

  /**
   * MODULES
   */
  getCommandsModule({ servicesManager, commandsManager }) {
    const data = {
      definitions: {
        exampleActionDef: {
          commandFn: ({ param1 }) => {
            console.log(`param1's value is: ${param1}`);
            commandsManager.runCommand('setToolActive', {
              toolName: 'Presentation',
            });
          },
          // storeContexts: ['viewports'],
          options: { param1: 'hello world' },
          context: 'VIEWER', // optional
        },
      },
      defaultContext: 'ACTIVE_VIEWPORT::DICOMSR',
    };
    return data;
  },
  getContextModule,
  getDataSourcesModule,
  getLayoutTemplateModule,
  getPanelModule,
  getViewportModule,
};

// appConfig,
// extensionConfig,
// dataSources,
// servicesManager,
// extensionManager,
// commandsManager,

const ExampleContext = React.createContext();

function ExampleContextProvider({ children }) {
  return (
    <ExampleContext.Provider value={{ example: 'value' }}>
      {children}
    </ExampleContext.Provider>
  );
}

const getContextModule = () => [
  {
    name: 'ExampleContext',
    context: ExampleContext,
    provider: ExampleContextProvider,
  },
];

const getDataSourcesModule = () => [
  {
    name: 'exampleDataSource',
    type: 'webApi', // 'webApi' | 'local' | 'other'
    createDataSource: dataSourceConfig => {
      return IWebApiDataSource.create(/* */);
    },
  },
];

const getLayoutTemplateModule = (/* ... */) => [
  {
    id: 'exampleLayout',
    name: 'exampleLayout',
    component: ExampleLayoutComponent,
  },
];

const getPanelModule = () => {
  return [
    {
      name: 'exampleSidePanel',
      iconName: 'info-circle-o',
      iconLabel: 'Example',
      label: 'Hello World',
      isDisabled: studies => { }, // optional
      component: ExamplePanelContentComponent,
    },
  ];
};

const getToolbarModule = () => { };

// displaySet, viewportIndex, dataSource
const getViewportModule = () => {
  const wrappedViewport = props => {
    return (
      <ExampleViewport
        {...props}
        onEvent={data => {
          commandsManager.runCommand('commandName', data);
        }}
      />
    );
  };

  return [{ name: 'example', component: wrappedViewport }];
};
