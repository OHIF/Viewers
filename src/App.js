import './config';

import {
  CommandsManager,
  ExtensionManager,
  HotkeysManager,
  utils,
} from 'ohif-core';
import React, { Component } from 'react';
import {
  getUserManagerForOpenIdConnectClient,
  initWebWorkers,
} from './utils/index.js';

import { I18nextProvider } from 'react-i18next';
import OHIFCornerstoneExtension from '@ohif/extension-cornerstone';
import OHIFDicomHtmlExtension from '@ohif/extension-dicom-html';
import OHIFDicomMicroscopyExtension from '@ohif/extension-dicom-microscopy';
import OHIFDicomPDFExtension from '@ohif/extension-dicom-pdf';
import OHIFStandaloneViewer from './OHIFStandaloneViewer';
import OHIFVTKExtension from '@ohif/extension-vtk';
import { OidcProvider } from 'redux-oidc';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import WhiteLabellingContext from './WhiteLabellingContext';
import appCommands from './appCommands';
import { getActiveContexts } from './store/layout/selectors.js';
import i18n from '@ohif/i18n';
import setupTools from './setupTools';
import store from './store';
// Imported flat feature since is not transpiled for old browser versions
import 'core-js/features/array/flat';

// ~~~~ APP SETUP
const commandsManagerConfig = {
  getAppState: () => store.getState(),
  getActiveContexts: () => getActiveContexts(store.getState()),
};

const commandsManager = new CommandsManager(commandsManagerConfig);
const hotkeysManager = new HotkeysManager(commandsManager);
const extensionManager = new ExtensionManager({ commandsManager });

// TODO: Should be done in extensions w/ commandsModule
// ~~ ADD COMMANDS
appCommands.init(commandsManager);
if (window.config.hotkeys) {
  hotkeysManager.setHotkeys(window.config.hotkeys, true);
}
// ~~~~ END APP SETUP

setupTools(store);

// const children = {
//   viewport: [<ConnectedToolContextMenu key="tool-context" />],
// };

/** TODO: extensions should be passed in as prop as soon as we have the extensions as separate packages and then registered by ExtensionsManager */
extensionManager.registerExtensions([
  OHIFCornerstoneExtension,
  OHIFVTKExtension,
  OHIFDicomPDFExtension,
  OHIFDicomHtmlExtension,
  OHIFDicomMicroscopyExtension,
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
          <I18nextProvider i18n={i18n}>
            <OidcProvider store={store} userManager={userManager}>
              <Router basename={this.props.routerBasename}>
                <WhiteLabellingContext.Provider
                  value={this.props.whiteLabelling}
                >
                  <OHIFStandaloneViewer userManager={userManager} />
                </WhiteLabellingContext.Provider>
              </Router>
            </OidcProvider>
          </I18nextProvider>
        </Provider>
      );
    }

    return (
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <Router basename={this.props.routerBasename}>
            <WhiteLabellingContext.Provider value={this.props.whiteLabelling}>
              <OHIFStandaloneViewer />
            </WhiteLabellingContext.Provider>
          </Router>
        </I18nextProvider>
      </Provider>
    );
  }
}

export default App;

// Make our managers accessible
export { commandsManager, extensionManager, hotkeysManager };
