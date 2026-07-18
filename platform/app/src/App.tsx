// External

import React, { useEffect, useState } from 'react';
import i18n from '@ohif/i18n';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter, type BrowserRouterProps } from 'react-router-dom';

import Compose from './routes/Mode/Compose';
import {
  ExtensionManager,
  CommandsManager,
  HotkeysManager,
  ServiceProvidersManager,
  SystemContextProvider,
  ViewportRefsProvider,
} from '@ohif/core';
import {
  ThemeWrapper as ThemeWrapperNext,
  NotificationProvider,
  ViewportGridProvider,
  DialogProvider,
  CineProvider,
  TooltipProvider,
  Modal as ModalNext,
  ManagedDialog,
  ModalProvider,
  ViewportDialogProvider,
  UserAuthenticationProvider,
} from '@ohif/ui-next';
// Viewer Project
// TODO: Should this influence study list?
import { AppConfigProvider } from '@state';
import createRoutes from './routes';
import appInit from './appInit.js';
import OpenIdConnectRoutes from './utils/OpenIdConnectRoutes';
import './App.css';

let commandsManager: CommandsManager,
  extensionManager: ExtensionManager,
  servicesManager: AppTypes.ServicesManager,
  serviceProvidersManager: ServiceProvidersManager,
  hotkeysManager: HotkeysManager;

const routerFutureFlags: BrowserRouterProps['future'] = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

function App({
  config = {
    /**
     * Relative route from domain root that OHIF instance is installed at.
     * For example:
     *
     * Hosted at: https://ohif.org/where-i-host-the/viewer/
     * Value: `/where-i-host-the/viewer/`
     * */
    routerBasename: '/',
    /**
     *
     */
    showLoadingIndicator: true,
    showStudyList: true,
    oidc: [],
    extensions: [],
  },
  defaultExtensions = [],
  defaultModes = [],
}) {
  const [init, setInit] = useState(null);
  useEffect(() => {
    const run = async () => {
      appInit(config, defaultExtensions, defaultModes).then(setInit).catch(console.error);
    };

    run();
  }, []);

  if (!init) {
    return null;
  }

  // Set above for named export
  commandsManager = init.commandsManager;
  extensionManager = init.extensionManager;
  servicesManager = init.servicesManager;
  serviceProvidersManager = init.serviceProvidersManager;
  hotkeysManager = init.hotkeysManager;

  // Set appConfig
  const appConfigState = init.appConfig;
  const { routerBasename, modes, dataSources, oidc, showStudyList } = appConfigState;

  // get the maximum 3D texture size
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');

  if (gl) {
    const max3DTextureSize = gl.getParameter(gl.MAX_3D_TEXTURE_SIZE);
    appConfigState.max3DTextureSize = max3DTextureSize;
  }

  const {
    uiDialogService,
    uiModalService,
    uiViewportDialogService,
    viewportGridService,
    cineService,
    userAuthenticationService,
    uiNotificationService,
  } = servicesManager.services;

  const providers = [
    [AppConfigProvider, { value: appConfigState }],
    [UserAuthenticationProvider, { service: userAuthenticationService }],
    [I18nextProvider, { i18n }],
    [ThemeWrapperNext],
    [SystemContextProvider, { commandsManager, extensionManager, hotkeysManager, servicesManager }],
    [ViewportRefsProvider],
    [ViewportGridProvider, { service: viewportGridService }],
    [ViewportDialogProvider, { service: uiViewportDialogService }],
    [CineProvider, { service: cineService }],
    [NotificationProvider, { service: uiNotificationService }],
    [TooltipProvider],
    [DialogProvider, { service: uiDialogService, dialog: ManagedDialog }],
    [ModalProvider, { service: uiModalService, modal: ModalNext }],
  ];

  // Providers registered with the ServiceProvidersManager are inserted ahead of
  // the dialog/modal providers: dialog and modal content renders at those
  // providers' own level (as a sibling of their children, not inside the route
  // tree), so any context a registered provider supplies must already be in
  // scope there.
  const providersFromManager = Object.entries(serviceProvidersManager.providers).map(
    ([serviceName, provider]) => [provider, { service: servicesManager.services[serviceName] }]
  );
  if (providersFromManager.length > 0) {
    const dialogIndex = providers.findIndex(([component]) => component === DialogProvider);
    providers.splice(dialogIndex, 0, ...providersFromManager);
  }

  const CombinedProviders = ({ children }) => Compose({ components: providers, children });

  let authRoutes = null;

  // customizationService.init(extensionManager) runs in appInit after extensions register;
  // do not call init again here — repeated init would duplicate-merge unless guarded (see CustomizationService.init).

  // Use config to create routes
  const appRoutes = createRoutes({
    modes,
    dataSources,
    extensionManager,
    servicesManager,
    commandsManager,
    hotkeysManager,
    routerBasename,
    showStudyList,
  });

  if (oidc) {
    authRoutes = (
      <OpenIdConnectRoutes
        oidc={oidc}
        routerBasename={routerBasename}
        userAuthenticationService={userAuthenticationService}
      />
    );
  }

  return (
    <CombinedProviders>
      <BrowserRouter
        basename={routerBasename}
        future={routerFutureFlags}
      >
        {authRoutes}
        {appRoutes}
      </BrowserRouter>
    </CombinedProviders>
  );
}



export default App;

export { commandsManager, extensionManager, servicesManager };
