import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation } from 'react-router';
import type { To, NavigateOptions } from 'react-router';
import { useNavigate } from 'react-router-dom';
import { utils } from '@ohif/core';
import { ImageViewerProvider, DragAndDropProvider } from '@ohif/ui-next';
import { useSearchParams } from '../../hooks';
import { useAppConfig } from '@state';
import ViewportGrid from '@components/ViewportGrid';
import Compose from './Compose';
import loadModules from '../../pluginImports';
import {
  recordRegistrationError,
  surfaceRuntimeExtensionFailures,
} from '../../runtimeExtensionLoader';
import { defaultRouteInit } from './defaultRouteInit';
import { updateAuthServiceAndCleanUrl } from './updateAuthServiceAndCleanUrl';

const { getSplitParam } = utils;

/**
 * The properties that the mode route gives to the `validateModeEntry` hook of a
 * mode, and to the default hook below.
 *
 * `navigate` does nothing after the user leaves the route.
 */
export type ValidateModeEntryProps = {
  studyInstanceUIDs?: string[];
  dataSource: any;
  navigate: (to: To, options?: NavigateOptions) => void;
  servicesManager: AppTypes.ServicesManager;
  extensionManager: AppTypes.ExtensionManager;
  commandsManager: AppTypes.CommandsManager;
  appConfig: AppTypes.Config;
  query: URLSearchParams;
};

/**
 * The default `validateModeEntry` hook. It checks that every study in the URL
 * exists in the data source, and it navigates to `/notfoundstudy` when a study
 * is absent or when the query fails.
 *
 * This check moved here from PanelStudyBrowser.tsx so that the check runs in
 * all modes. A mode that does not load its data by StudyInstanceUID replaces
 * this check with its own `validateModeEntry` - see `ModeRoute` below.
 *
 * @param props.studyInstanceUIDs the studies that the URL asks for
 * @param props.dataSource the active data source
 * @param props.navigate navigates away, and does nothing after an unmount
 */
async function validateStudies({
  studyInstanceUIDs,
  dataSource,
  navigate,
}: ValidateModeEntryProps) {
  if (!studyInstanceUIDs?.length || !dataSource) {
    return;
  }

  for (const studyInstanceUID of studyInstanceUIDs) {
    try {
      const qidoForStudyUID = await dataSource.query.studies.search({
        studyInstanceUid: studyInstanceUID,
      });

      if (!qidoForStudyUID?.length) {
        console.warn('Study not found:', studyInstanceUID);
        navigate('/notfoundstudy');
        return;
      }
    } catch (error) {
      console.error('Error validating study:', studyInstanceUID, error);
      navigate('/notfoundstudy');
      return;
    }
  }
}

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

  const navigate = useNavigate();

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

  if (location !== locationRef.current) {
    layoutTemplateData.current = null;
    locationRef.current = location;
  }

  const {
    displaySetService,
    panelService,
    hangingProtocolService,
    userAuthenticationService,
    customizationService,
  } = servicesManager.services;

  const { extensions, sopClassHandlers, hangingProtocol } = mode;

  const runTimeHangingProtocolId = lowerCaseSearchParams.get('hangingprotocolid');
  const runTimeStageId = lowerCaseSearchParams.get('stageid');
  const token = lowerCaseSearchParams.get('token');

  if (token) {
    updateAuthServiceAndCleanUrl(token, location, userAuthenticationService);
  }

  // An undefined dataSourceName implies that the active data source that is already set in the ExtensionManager should be used.
  if (dataSourceName !== undefined) {
    extensionManager.setActiveDataSource(dataSourceName);
  }

  const dataSource = extensionManager.getActiveDataSourceOrNull();

  // Only handling one route per mode for now
  const route = mode.routes?.[0] ?? null;

  useEffect(() => {
    const loadExtensions = async () => {
      try {
        const loadedExtensions = await loadModules(Object.keys(extensions));
        for (const extension of loadedExtensions) {
          if (!extension) {
            continue; // runtime load failure — already audited by the loader
          }
          const { id: extensionId } = extension;
          if (extensionManager.registeredExtensionIds.indexOf(extensionId) === -1) {
            try {
              await extensionManager.registerExtension(extension);
            } catch (error) {
              recordRegistrationError(extensionId, error);
            }
          }
        }

        // Mode dependency extensions register their customization modules here,
        // but `registerExtension` does not merge them into the customization
        // service — that otherwise only happens later in
        // `extensionManager.onModeEnter`. Merge them now so anything that runs
        // before setupRouteInit (e.g. a mode's layoutTemplate) can already read
        // the defaults these extensions provide.
        // `init` is idempotent — each extension module is merged at most once.
        customizationService.init(extensionManager);

        if (isMounted.current) {
          setExtensionDependenciesLoaded(true);
        }
      } finally {
        surfaceRuntimeExtensionFailures(servicesManager.services.uiNotificationService);
      }
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

        // Register panels immediately so ViewerLayout's first render sees them.
        // ResizablePanelsHook only auto-expands side panels on the initial mount;
        // if panels are added later, the viewport grid keeps the wrong width.
        // setupRouteInit (below) resets and re-applies them after customizations
        // are layered on, so URL/config modules can still modify the lists.
        panelService.reset();
        panelService.addPanels(panelService.PanelPosition.Left, leftPanels);
        panelService.addPanels(panelService.PanelPosition.Right, rightPanels);

        // Stash the layout lists for setupRouteInit to seed into the
        // `leftPanels` / `rightPanels` customizations.
        layoutData.panels = { leftPanels, rightPanels };

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
    if (!layoutTemplateData.current || !ExtensionDependenciesLoaded || !studyInstanceUIDs?.length) {
      return;
    }

    // The validation can complete after the user leaves the route, so a
    // navigation can happen after an unmount. A navigation after an unmount
    // removes the user from the route that the user already moved to.
    const navigateIfMounted = (to: To, options?: NavigateOptions) => {
      if (isMounted.current) {
        navigate(to, options);
      }
    };

    // Starts the validation, and does not wait for the validation.
    //
    // `setupRouteInit` calls this function after `route.init`, and before
    // `defaultRouteInit`. Every hook that sets a custom authentication token
    // runs before that point: `onModeInit`, the `onModeEnter` of the
    // extensions, the `onModeEnter` of the mode, and `route.init`. The
    // validation query then uses that token.
    //
    // The validation does not use the promise of `setupRouteInit`, and the
    // validation runs at the same time as the retrieve of the metadata. Two
    // results come from this:
    //
    //   - The validation does not add a delay to the retrieve. This keeps the
    //     behaviour of OHIF 3.13, where the validation ran in its own effect.
    //   - The validation still runs when `defaultRouteInit` rejects. An
    //     invalid StudyInstanceUID gives an undefined `activeStudy`, and
    //     `hangingProtocolService.run` throws for that undefined study. A
    //     validation that waits for the promise of `setupRouteInit` never runs
    //     in that case, and the viewer never shows the "not found" page.
    //     See `tests/StudyValidation.spec.ts`.
    const startModeEntryValidation = () => {
      // `mode.validateModeEntry` replaces the default study check. The hook can
      // be an async function, and the hook can navigate away on its own.
      const validateModeEntry = mode?.validateModeEntry ?? validateStudies;

      // `Promise.resolve` starts the chain, so a hook that throws before the
      // hook returns its promise also gives a rejection, and no rejection
      // stays unhandled.
      Promise.resolve()
        .then(() =>
          validateModeEntry({
            studyInstanceUIDs,
            dataSource,
            navigate: navigateIfMounted,
            servicesManager,
            extensionManager,
            commandsManager,
            appConfig,
            query,
          })
        )
        .catch(e => {
          console.warn('mode entry validation failure', e);
        });
    };

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

      // `extensionManager.onModeEnter` resets the customization mode scope via
      // `customizationService.onModeEnter`; the mode scope is then layered
      // bottom-up so the final value of every key is decided by scope
      // precedence (global > mode > default) and application order alone:
      //   1. the mode's own values — its layout panel lists, seeded as the
      //      standard `leftPanels` / `rightPanels` customizations;
      //      its toolbar/tool-group composition, seeded as the plain
      //      `toolbarButtons` / `toolbarSections` / `toolGroupAdditions`
      //      customizations (resolved to concrete definitions later, when the
      //      mode's `onModeEnter` registers the toolbar); and its
      //      `modeCustomizations` block (declared as data on the mode
      //      instance, usually as a customization name registered at default
      //      scope when the mode loaded, so bootstrap/global customizations
      //      can modify the block itself before it is applied);
      //   2. the app config / URL `mode` phase blocks — the general (`*`)
      //      block first, then any block keyed by this mode's id / routeName.
      const { leftPanels = [], rightPanels = [] } = layoutTemplateData.current.panels ?? {};
      customizationService.setCustomizations({
        leftPanels,
        rightPanels,
        toolbarButtons: mode.toolbarButtons ?? [],
        toolbarSections: mode.toolbarSections ?? [],
        toolGroupAdditions: mode.toolGroupAdditions ?? {},
      });

      const modeCustomizations =
        typeof mode.modeCustomizations === 'string'
          ? customizationService.getCustomization(mode.modeCustomizations)
          : mode.modeCustomizations;
      if (modeCustomizations) {
        customizationService.setCustomizations(modeCustomizations);
      }
      customizationService.applyModeCustomizations([mode.id, mode.routeName]);

      // Re-apply panels only when customizations changed the lists. When they
      // match the layout, the panels registered in retrieveLayoutData are left
      // in place so ViewerLayout's ResizablePanelsHook keeps the correct sizes
      // from its one-time initial expand.
      const resolvedLeftPanels = customizationService.getValue('leftPanels') ?? [];
      const resolvedRightPanels = customizationService.getValue('rightPanels') ?? [];
      const panelsChanged =
        JSON.stringify(resolvedLeftPanels) !== JSON.stringify(leftPanels) ||
        JSON.stringify(resolvedRightPanels) !== JSON.stringify(rightPanels);

      if (panelsChanged) {
        panelService.reset();
        panelService.addPanels(panelService.PanelPosition.Left, resolvedLeftPanels);
        panelService.addPanels(panelService.PanelPosition.Right, resolvedRightPanels);
      }

      // use the URL hangingProtocolId if it exists, otherwise use the one
      // defined in the mode configuration
      const hangingProtocolIdToUse = hangingProtocolService.getProtocolById(
        runTimeHangingProtocolId
      )
        ? runTimeHangingProtocolId
        : hangingProtocol;

      // Determine the index of the stageId if the hangingProtocolIdToUse is defined
      const stageIndex = Array.isArray(hangingProtocolIdToUse)
        ? -1
        : hangingProtocolService.getStageIndex(hangingProtocolIdToUse, {
            stageId: runTimeStageId || undefined,
          });
      // Ensure that the stage index is never negative
      // If stageIndex is negative (e.g., if stage wasn't found), use 0 as the default
      const stageIndexToUse = Math.max(0, stageIndex);

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

      // Move hotkeys setup here, after onModeEnter
      const hotkeys = customizationService.getCustomization('ohif.hotkeyBindings');
      hotkeysManager.setDefaultHotKeys(hotkeys);

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
          if (lowerVal === 'seriesinstanceuids' || lowerVal === 'seriesinstanceuid') {
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
          hangingProtocolIdToUse,
          stageIndexToUse
        );
      }

      // Every hook that can set a custom authentication token has run, so the
      // validation starts here. The validation runs at the same time as the
      // retrieve below.
      startModeEntryValidation();

      return defaultRouteInit(
        {
          servicesManager,
          studyInstanceUIDs,
          dataSource,
          filters,
          appConfig,
        },
        hangingProtocolIdToUse,
        stageIndexToUse
      );
    };

    let unsubscriptions;
    setupRouteInit().then(unsubs => {
      unsubscriptions = unsubs;

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
      // Clean up hotkeys
      hotkeysManager.destroy();

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
