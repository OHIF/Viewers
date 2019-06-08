import './config';

import {
  CommandsManager,
  HotkeysManager,
  extensions,
  redux,
  utils,
} from 'ohif-core';
import React, { Component } from 'react';
import {
  getDefaultToolbarButtons,
  getUserManagerForOpenIdConnectClient,
  initWebWorkers,
} from './utils/index.js';

import ConnectedToolContextMenu from './connectedComponents/ConnectedToolContextMenu';
import OHIFCornerstoneExtension from '@ohif/extension-cornerstone';
import OHIFDicomHtmlExtension from 'ohif-dicom-html-extension';
import OHIFDicomMicroscopyExtension from '@ohif/extension-dicom-microscopy';
import OHIFDicomPDFExtension from 'ohif-dicom-pdf-extension';
import OHIFStandaloneViewer from './OHIFStandaloneViewer';
import OHIFVTKExtension from '@ohif/extension-vtk';
import { OidcProvider } from 'redux-oidc';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import WhiteLabellingContext from './WhiteLabellingContext';
import appCommands from './appCommands';
import setupTools from './setupTools';
import store from './store';

// ~~~~ APP SETUP
const commandsManagerConfig = {
  getAppState: () => store.getState(),
  getActiveContexts: () => store.getState().ui.activeContexts,
};

const commandsManager = new CommandsManager(commandsManagerConfig);
const hotkeysManager = new HotkeysManager(commandsManager);

// TODO: Should be done in extensions w/ commandsModule
// ~~ ADD COMMANDS
appCommands.init(commandsManager);
if (window.config.hotkeys) {
  hotkeysManager.setHotkeys(window.config.hotkeys, true);
}

// Force active contexts for now. These should be set in Viewer/ActiveViewer
store.dispatch({
  type: 'ADD_ACTIVE_CONTEXT',
  item: 'VIEWER',
});
store.dispatch({
  type: 'ADD_ACTIVE_CONTEXT',
  item: 'VIEWER::CORNERSTONE',
});

// ~~~~ END APP SETUP

setupTools(store);

const children = {
  viewport: [<ConnectedToolContextMenu key="tool-context" />],
};

/** TODO: extensions should be passed in as prop as soon as we have the extensions as separate packages and then registered by ExtensionsManager */
extensions.ExtensionManager.registerExtensions(store, [
  new OHIFCornerstoneExtension({ children }),
  new OHIFVTKExtension(),
  new OHIFDicomPDFExtension(),
  new OHIFDicomHtmlExtension(),
  new OHIFDicomMicroscopyExtension(),
]);

// TODO[react] Use a provider when the whole tree is React
window.store = store;

function handleServers(servers) {
  if (servers) {
    utils.addServers(servers, store);
  }
}

class App extends Component {
  static propTypes = {
    routerBasename: PropTypes.string.isRequired,
    relativeWebWorkerScriptsPath: PropTypes.string.isRequired,
    servers: PropTypes.object.isRequired,
    oidc: PropTypes.array,
    whiteLabelling: PropTypes.object,
  };

  static defaultProps = {
    whiteLabelling: {},
    oidc: [],
  };

  constructor(props) {
    super(props);

    //
    const defaultButtons = getDefaultToolbarButtons(this.props.routerBasename);
    const buttonsAction = redux.actions.setAvailableButtons(defaultButtons);

    store.dispatch(buttonsAction);

    if (this.props.oidc.length) {
      const firstOpenIdClient = this.props.oidc[0];

      this.userManager = getUserManagerForOpenIdConnectClient(
        store,
        firstOpenIdClient
      );
    }
    handleServers(this.props.servers);
    initWebWorkers(
      this.props.routerBasename,
      this.props.relativeWebWorkerScriptsPath
    );
  }

  render() {
    const userManager = this.userManager;

    if (userManager) {
      return (
        <Provider store={store}>
          <OidcProvider store={store} userManager={userManager}>
            <Router basename={this.props.routerBasename}>
              <WhiteLabellingContext.Provider value={this.props.whiteLabelling}>
                <OHIFStandaloneViewer userManager={userManager} />
              </WhiteLabellingContext.Provider>
            </Router>
          </OidcProvider>
        </Provider>
      );
    }

    return (
      <Provider store={store}>
        <Router basename={this.props.routerBasename}>
          <WhiteLabellingContext.Provider value={this.props.whiteLabelling}>
            <OHIFStandaloneViewer />
          </WhiteLabellingContext.Provider>
        </Router>
      </Provider>
    );
  }
}

export default App;

export { commandsManager, hotkeysManager };
