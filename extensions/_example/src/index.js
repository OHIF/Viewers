import ImageSet from '@ohif/core/src/classes/ImageSet';
import { IWebApiDataSource } from '@ohif/core';

/**
 *
 */
export default {
  id: '@ohif/extension-*',

  /**
   * LIFECYCLE HOOKS
   */
  preRegistration() {},
  beforeExtInit() {},
  beforeExtDestroy() {},

  /**
   * MODULES
   */
  getCommandsModule,
  getContextModule,
  getDataSourcesModule,
  getLayoutTemplateModule,
  getPanelModule,
  getSopClassHandlerModule,
  getToolbarModule() {},
  getViewportModule,
};

// appConfig,
// extensionConfig,
// dataSources,
// servicesManager,
// extensionManager,
// commandsManager,

/**
 *
 */
const getCommandsModule = () => ({
  definitions: {
    exampleActionDef: {
      commandFn: ({ param1 }) => {
        console.log(`param1's value is: ${param1}`);
      },
      // storeContexts: ['viewports'],
      options: { param1: 'hello world' },
      context: 'VIEWER', // optional
    },
  },
  defaultContext: 'ACTIVE_VIEWPORT::DICOMSR',
});

const ExampleContext = React.createContext();

function ExampleContextProvider({ children }) {
  return <ExampleContext.Provider value={{ example: 'value' }}>{children}</ExampleContext.Provider>;
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
      isDisabled: studies => {}, // optional
      component: ExamplePanelContentComponent,
    },
  ];
};

const getSopClassHandlerModule = (/* ... */) => {
  const BASIC_TEXT_SR = '1.2.840.10008.5.1.4.1.1.88.11';

  return [
    {
      name: 'ExampleSopClassHandle',
      sopClassUids: [BASIC_TEXT_SR],
      getDisplaySetsFromSeries: instances => {
        const imageSet = new ImageSet(instances);

        imageSet.setAttributes(/** */);
        imageSet.sortBy((a, b) => 0);

        return imageSet;
      },
    },
  ];
};

const getToolbarModule = () => {};

// displaySet, dataSource
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
