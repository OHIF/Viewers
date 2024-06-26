import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router';
import PropTypes from 'prop-types';
import { utils } from '@ohif/core';
import { DragAndDropProvider, ImageViewerProvider } from '@ohif/ui';
import { useSearchParams } from '@hooks';
import { useAppConfig } from '@state';
import ViewportGrid from '@components/ViewportGrid';
import Compose from './Compose';
import { history } from '../../utils/history';
import loadModules from '../../pluginImports';
import { defaultRouteInit } from './defaultRouteInit';
import { updateAuthServiceAndCleanUrl } from './updateAuthServiceAndCleanUrl';

const { getSplitParam } = utils;

export default function ModeRoute({
  mode,
  dataSourceName,
  extensionManager,
  servicesManager,
  commandsManager,
  hotkeysManager,
}: withAppTypes) {
  const [appConfig] = useAppConfig();

  // Parse route params/querystring
  const location = useLocation();

  // The react router DOM placeholder map (see https://reactrouter.com/en/main/hooks/use-params).
  const params = useParams();
  // The URL's query search parameters where the keys casing is maintained
  const query = useSearchParams();

  mode?.onModeInit?.({
    servicesManager,
    extensionManager,
    commandsManager,
    appConfig,
    query,
  });

  // The URL's query search parameters where the keys are all lower case.
  const lowerCaseSearchParams = useSearchParams({ lowerCaseKeys: true });

  const [studyInstanceUIDs, setStudyInstanceUIDs] = useState(null);

  const [refresh, setRefresh] = useState(false);
  const [ExtensionDependenciesLoaded, setExtensionDependenciesLoaded] = useState(false);

  const layoutTemplateData = useRef(false);
  const locationRef = useRef(null);
  const isMounted = useRef(false);

  // Expose the react router dom navigation.
  history.navigate = useNavigate();

  if (location !== locationRef.current) {
    layoutTemplateData.current = null;
    locationRef.current = location;
  }

  const { displaySetService, panelService, hangingProtocolService, userAuthenticationService } =
    servicesManager.services;

  const { extensions, sopClassHandlers, hotkeys: hotkeyObj, hangingProtocol } = mode;

  const runTimeHangingProtocolId = lowerCaseSearchParams.get('hangingprotocolid');
  const token = lowerCaseSearchParams.get('token');

  if (token) {
    updateAuthServiceAndCleanUrl(token, location, userAuthenticationService);
  }

  // Preserve the old array interface for hotkeys
  const hotkeys = Array.isArray(hotkeyObj) ? hotkeyObj : hotkeyObj?.hotkeys;
  const hotkeyName = hotkeyObj?.name || 'hotkey-definitions';

  // An undefined dataSourceName implies that the active data source that is already set in the ExtensionManager should be used.
  if (dataSourceName !== undefined) {
    extensionManager.setActiveDataSource(dataSourceName);
  }

  const dataSource = extensionManager.getActiveDataSource()[0];

  // Only handling one route per mode for now
  const route = mode.routes[0];

  useEffect(() => {
    const loadExtensions = async () => {
      const loadedExtensions = await loadModules(Object.keys(extensions));
      for (const extension of loadedExtensions) {
        const { id: extensionId } = extension;
        if (extensionManager.registeredExtensionIds.indexOf(extensionId) === -1) {
          await extensionManager.registerExtension(extension);
        }
      }
      setExtensionDependenciesLoaded(true);
    };

    loadExtensions();
  }, []);

  useEffect(() => {
    // Preventing state update for unmounted component
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!ExtensionDependenciesLoaded) {
      return;
    }

    // Todo: this should not be here, data source should not care about params
    const initializeDataSource = async (params, query) => {
      await dataSource.initialize({
        params,
        query,
      });
      setStudyInstanceUIDs(dataSource.getStudyInstanceUIDs({ params, query }));
    };

    initializeDataSource(params, query);
    return () => {
      layoutTemplateData.current = null;
    };
  }, [location, ExtensionDependenciesLoaded]);

  useEffect(() => {
    if (!ExtensionDependenciesLoaded || !studyInstanceUIDs?.length) {
      return;
    }

    const retrieveLayoutData = async () => {
      const layoutData = await route.layoutTemplate({
        location,
        servicesManager,
        studyInstanceUIDs,
      });

      if (isMounted.current) {
        const { leftPanels = [], rightPanels = [], ...layoutProps } = layoutData.props;

        panelService.reset();
        panelService.addPanels(panelService.PanelPosition.Left, leftPanels);
        panelService.addPanels(panelService.PanelPosition.Right, rightPanels);

        // layoutProps contains all props but leftPanels and rightPanels
        layoutData.props = layoutProps;

        layoutTemplateData.current = layoutData;
        setRefresh(!refresh);
      }
    };
    if (Array.isArray(studyInstanceUIDs) && studyInstanceUIDs[0]) {
      retrieveLayoutData();
    }
    return () => {
      layoutTemplateData.current = null;
    };
  }, [studyInstanceUIDs, ExtensionDependenciesLoaded]);

  useEffect(() => {
    if (!hotkeys || !ExtensionDependenciesLoaded || !studyInstanceUIDs?.length) {
      return;
    }

    hotkeysManager.setDefaultHotKeys(hotkeys);

    const userPreferredHotkeys = JSON.parse(localStorage.getItem(hotkeyName));

    if (userPreferredHotkeys?.length) {
      hotkeysManager.setHotkeys(userPreferredHotkeys, hotkeyName);
    } else {
      hotkeysManager.setHotkeys(hotkeys, hotkeyName);
    }

    return () => {
      hotkeysManager.destroy();
    };
  }, [ExtensionDependenciesLoaded, hotkeys, studyInstanceUIDs]);

  useEffect(() => {
    if (!layoutTemplateData.current || !ExtensionDependenciesLoaded || !studyInstanceUIDs?.length) {
      return;
    }

    const setupRouteInit = async () => {
      // TODO: For some reason this is running before the Providers
      // are calling setServiceImplementation
      // TODO -> iterate through services.

      // Extension

      // Add SOPClassHandlers to a new SOPClassManager.
      displaySetService.init(extensionManager, sopClassHandlers);

      extensionManager.onModeEnter({
        servicesManager,
        extensionManager,
        commandsManager,
        appConfig,
      });

      // use the URL hangingProtocolId if it exists, otherwise use the one
      // defined in the mode configuration
      const hangingProtocolIdToUse = hangingProtocolService.getProtocolById(
        runTimeHangingProtocolId
      )
        ? runTimeHangingProtocolId
        : hangingProtocol;

      // Sets the active hanging protocols - if hangingProtocol is undefined,
      // resets to default.  Done before the onModeEnter to allow the onModeEnter
      // to perform custom hanging protocol actions
      hangingProtocolService.setActiveProtocolIds(hangingProtocolIdToUse);

      mode?.onModeEnter({
        servicesManager,
        extensionManager,
        commandsManager,
        appConfig,
      });

      /**
       * The next line should get all the query parameters provided by the URL
       * - except the StudyInstanceUIDs - and create an object called filters
       * used to filtering the study as the user wants otherwise it will return
       * a empty object.
       *
       * Example:
       * const filters = {
       *   seriesInstanceUID: 1.2.276.0.7230010.3.1.3.1791068887.5412.1620253993.114611
       * }
       */
      const filters =
        Array.from(query.keys()).reduce((acc: Record<string, string>, val: string) => {
          const lowerVal = val.toLowerCase();
          // Not sure why the case matters here - it doesn't in the URL
          if (lowerVal === 'seriesinstanceuids') {
            const seriesUIDs = getSplitParam(lowerVal, query);
            return {
              ...acc,
              seriesInstanceUID: seriesUIDs,
            };
          }
          return { ...acc, [val]: getSplitParam(lowerVal, query) };
        }, {}) ?? {};

      let unsubs;

      if (route.init) {
        unsubs = await route.init(
          {
            servicesManager,
            extensionManager,
            hotkeysManager,
            studyInstanceUIDs,
            dataSource,
            filters,
          },
          hangingProtocolIdToUse
        );
      }

      return defaultRouteInit(
        {
          servicesManager,
          studyInstanceUIDs,
          dataSource,
          filters,
          appConfig,
        },
        hangingProtocolIdToUse
      );
    };

    let unsubscriptions;
    setupRouteInit().then(unsubs => {
      unsubscriptions = unsubs;

      // Some code may need to run after hanging protocol initialization
      // (eg: workflowStepsService initialization on 4D mode)
      mode?.onSetupRouteComplete?.({
        servicesManager,
        extensionManager,
        commandsManager,
      });
    });

    return () => {
      // The mode.onModeExit must be done first to allow it to store
      // information, and must be in a try/catch to ensure subscriptions
      // are unsubscribed.
      try {
        mode?.onModeExit?.({
          servicesManager,
          extensionManager,
          appConfig,
        });
      } catch (e) {
        console.warn('mode exit failure', e);
      }
      // The unsubscriptions must occur before the extension onModeExit
      // in order to prevent exceptions during cleanup caused by spurious events
      if (unsubscriptions) {
        unsubscriptions.forEach(unsub => {
          unsub();
        });
      }
      // The extension manager must be called after the mode, this is
      // expected to cleanup the state to a standard setup.
      extensionManager.onModeExit();
    };
  }, [
    mode,
    dataSourceName,
    location,
    ExtensionDependenciesLoaded,
    route,
    servicesManager,
    extensionManager,
    hotkeysManager,
    studyInstanceUIDs,
    refresh,
  ]);

  if (!studyInstanceUIDs || !layoutTemplateData.current || !ExtensionDependenciesLoaded) {
    return null;
  }

  const ViewportGridWithDataSource = props => {
    return ViewportGrid({ ...props, dataSource });
  };

  const CombinedExtensionsContextProvider = createCombinedContextProvider(
    extensionManager,
    servicesManager,
    commandsManager
  );

  const getLayoutComponent = props => {
    const layoutTemplateModuleEntry = extensionManager.getModuleEntry(
      layoutTemplateData.current.id
    );
    const LayoutComponent = layoutTemplateModuleEntry.component;

    return <LayoutComponent {...props} />;
  };

  const LayoutComponent = getLayoutComponent({
    ...layoutTemplateData.current.props,
    ViewportGridComp: ViewportGridWithDataSource,
  });

  return (
    <ImageViewerProvider StudyInstanceUIDs={studyInstanceUIDs}>
      {CombinedExtensionsContextProvider ? (
        <CombinedExtensionsContextProvider>
          <DragAndDropProvider>{LayoutComponent}</DragAndDropProvider>
        </CombinedExtensionsContextProvider>
      ) : (
        <DragAndDropProvider>{LayoutComponent}</DragAndDropProvider>
      )}
    </ImageViewerProvider>
  );
}

/**
 * Creates a combined context provider using the context modules from the extension manager.
 * @param {object} extensionManager - The extension manager instance.
 * @param {object} servicesManager - The services manager instance.
 * @param {object} commandsManager - The commands manager instance.
 * @returns {React.Component} - A React component that provides combined contexts to its children.
 */
function createCombinedContextProvider(extensionManager, servicesManager, commandsManager) {
  const extensionsContextModules = extensionManager.getModulesByType(
    extensionManager.constructor.MODULE_TYPES.CONTEXT
  );

  if (!extensionsContextModules?.length) {
    return;
  }

  const contextModuleProviders = extensionsContextModules.flatMap(({ module }) => {
    return module.map(aContextModule => {
      return aContextModule.provider;
    });
  });

  return ({ children }) => {
    return Compose({ components: contextModuleProviders, children });
  };
}

ModeRoute.propTypes = {
  mode: PropTypes.object.isRequired,
  dataSourceName: PropTypes.string,
  extensionManager: PropTypes.object,
  servicesManager: PropTypes.object,
  hotkeysManager: PropTypes.object,
  commandsManager: PropTypes.object,
};
