// External

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
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
  const [init, setInit] = useState<any>(null);
  
  useEffect(() => {
    const run = async () => {
      const initResult = await appInit(config, defaultExtensions, defaultModes);
      // Expose servicesManager to window for CustomSegmentationOverlay
      if (initResult?.servicesManager) {
        (window as any).__servicesManager = initResult.servicesManager;
        console.log('OHIF: Exposed servicesManager to window');
      }
      setInit(initResult);
    };

    run();
  }, []);

  // Listen for postMessage from parent Vue component
  useEffect(() => {
    console.log('OHIF: Setting up postMessage listener');
    const handleMessage = (event) => {
      console.log('OHIF: Received postMessage:', event.data);
      // Only accept messages from same origin or configured origin
      if (event.origin !== window.location.origin && event.origin !== 'http://localhost:3000' && event.origin !== 'http://localhost:5174') {
        console.log('OHIF: Ignoring message from different origin:', event.origin);
        return;
      }

      const { type, caseId, fileName, segFile } = event.data;

      if (type === 'SET_CASE_ID' && caseId) {
        console.log('OHIF: Received SET_CASE_ID message:', caseId);
        // Store caseId in sessionStorage for use by other components
        sessionStorage.setItem('ohifCaseId', caseId);
      } else if (type === 'LOAD_CUSTOM_SEG' && caseId && fileName) {
        console.log('OHIF: Received LOAD_CUSTOM_SEG message with caseId:', caseId, 'fileName:', fileName);
        // 直接触发SEG_LOADED事件，传递caseId和fileName
        window.dispatchEvent(new CustomEvent('SEG_LOADED', {
          detail: { caseId, fileName }
        }));
        console.log('OHIF: Dispatched SEG_LOADED event');
      } else if (type === 'UNLOAD_CUSTOM_SEG' && caseId && fileName) {
        console.log('OHIF: Received UNLOAD_CUSTOM_SEG message with caseId:', caseId, 'fileName:', fileName);
        // 触发SEG_UNLOADED事件，传递caseId和fileName
        window.dispatchEvent(new CustomEvent('SEG_UNLOADED', {
          detail: { caseId, fileName }
        }));
        console.log('OHIF: Dispatched SEG_UNLOADED event');
      } else if (type === 'RELOAD_STUDY') {
        console.log('OHIF: Received RELOAD_STUDY message');
        // Reload the current study to refresh DICOMweb
        window.location.reload();
      } else if (type === 'GET_SEG_FILES') {
        console.log('OHIF: Received GET_SEG_FILES message');
        // Get SEG files from the display set service
        const displaySetService = servicesManager?.services?.displaySetService;
        console.log('OHIF: displaySetService:', displaySetService);
        
        const segFiles: any[] = [];
        if (displaySetService) {
          console.log('OHIF: Trying to get display sets');
          try {
            const displaySets = displaySetService.getDisplaySetsBy((ds: any) => ds.Modality === 'SEG');
            console.log('OHIF: Got display sets:', displaySets);
            
            // 获取caseId用于构建API URL
            const caseId = sessionStorage.getItem('ohifCaseId');
            
            for (const ds of displaySets) {
              console.log('OHIF: Processing display set:', ds);
              if (ds.SOPInstanceUID) {
                const segFile: any = {
                  id: ds.SOPInstanceUID,
                  name: ds.SeriesDescription || `SEG ${ds.SeriesNumber}`,
                  seriesInstanceUID: ds.SeriesInstanceUID,
                  sopInstanceUID: ds.SOPInstanceUID,
                  description: ds.SeriesDescription,
                };
                
                segFiles.push(segFile);
              }
            }
          } catch (error) {
            console.error('OHIF: Error getting display sets:', error);
          }
        } else {
          console.log('OHIF: displaySetService is not available');
        }
        
        console.log('OHIF: Sending SEG files back to parent:', segFiles);
        event.source.postMessage({
          type: 'SEG_FILES_RESPONSE',
          segFiles: segFiles
        }, event.origin);
      }
    };

    window.addEventListener('message', handleMessage);
    console.log('OHIF: postMessage listener added');

    return () => {
      window.removeEventListener('message', handleMessage);
      console.log('OHIF: postMessage listener removed');
    };
  }, [commandsManager, servicesManager]);

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

App.propTypes = {
  config: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({
      routerBasename: PropTypes.string,
      oidc: PropTypes.array,
      whiteLabeling: PropTypes.object,
      extensions: PropTypes.array,
      showLoadingIndicator: PropTypes.bool,
      showStudyList: PropTypes.bool,
      modes: PropTypes.array,
      dataSources: PropTypes.array,
    }),
  ]),
  /* Extensions that are "bundled" or "baked-in" to the application.
   * These would be provided at build time as part of they entry point. */
  defaultExtensions: PropTypes.array,
  /* Modes that are "bundled" or "baked-in" to the application.
   * These would be provided at build time as part of they entry point. */
  defaultModes: PropTypes.array,
};

export default App;

export { commandsManager, extensionManager, servicesManager };
