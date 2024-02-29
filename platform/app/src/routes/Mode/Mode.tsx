import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router';
import PropTypes from 'prop-types';
// TODO: DicomMetadataStore should be injected?
import { DicomMetadataStore, ServicesManager, utils, log, Enums } from '@ohif/core';
import { DragAndDropProvider, ImageViewerProvider } from '@ohif/ui';
import { useSearchParams } from '@hooks';
import { useAppConfig } from '@state';
import ViewportGrid from '@components/ViewportGrid';
import Compose from './Compose';
import getStudies from './studiesList';
import { history } from '../../utils/history';
import loadModules from '../../pluginImports';
import isSeriesFilterUsed from '../../utils/isSeriesFilterUsed';

const { getSplitParam, sortingCriteria } = utils;

/**
 * Initialize the route.
 *
 * @param props.servicesManager to read services from
 * @param props.studyInstanceUIDs for a list of studies to read
 * @param props.dataSource to read the data from
 * @param props.filters filters from query params to read the data from
 * @returns array of subscriptions to cancel
 */
function defaultRouteInit(
  { servicesManager, studyInstanceUIDs, dataSource, filters, appConfig },
  hangingProtocolId
) {
  const { displaySetService, hangingProtocolService, uiNotificationService, customizationService } =
    servicesManager.services;
  /**
   * Function to apply the hanging protocol when the minimum number of display sets were
   * received or all display sets retrieval were completed
   * @returns
   */
  function applyHangingProtocol() {
    const displaySets = displaySetService.getActiveDisplaySets();

    if (!displaySets || !displaySets.length) {
      return;
    }

    // Gets the studies list to use
    const studies = getStudies(studyInstanceUIDs, displaySets);

    // study being displayed, and is thus the "active" study.
    const activeStudy = studies[0];

    // run the hanging protocol matching on the displaySets with the predefined
    // hanging protocol in the mode configuration
    hangingProtocolService.run({ studies, activeStudy, displaySets }, hangingProtocolId);
  }

  const unsubscriptions = [];
  const issuedWarningSeries = [];
  const { unsubscribe: instanceAddedUnsubscribe } = DicomMetadataStore.subscribe(
    DicomMetadataStore.EVENTS.INSTANCES_ADDED,
    function ({ StudyInstanceUID, SeriesInstanceUID, madeInClient = false }) {
      const seriesMetadata = DicomMetadataStore.getSeries(StudyInstanceUID, SeriesInstanceUID);

      // checks if the series filter was used, if it exists
      const seriesInstanceUIDs = filters?.seriesInstanceUID;
      if (
        seriesInstanceUIDs?.length &&
        !isSeriesFilterUsed(seriesMetadata.instances, filters) &&
        !issuedWarningSeries.includes(seriesInstanceUIDs[0])
      ) {
        // stores the series instance filter so it shows only once the warning
        issuedWarningSeries.push(seriesInstanceUIDs[0]);
        uiNotificationService.show({
          title: 'Series filter',
          message: `Each of the series in filter: ${seriesInstanceUIDs} are not part of the current study. The entire study is being displayed`,
          type: 'error',
          duration: 7000,
        });
      }

      displaySetService.makeDisplaySets(seriesMetadata.instances, madeInClient);
    }
  );

  unsubscriptions.push(instanceAddedUnsubscribe);

  log.time(Enums.TimingEnum.STUDY_TO_DISPLAY_SETS);
  log.time(Enums.TimingEnum.STUDY_TO_FIRST_IMAGE);

  const allRetrieves = studyInstanceUIDs.map(StudyInstanceUID =>
    dataSource.retrieve.series.metadata({
      StudyInstanceUID,
      filters,
      returnPromises: true,
      sortCriteria:
        customizationService.get('sortingCriteria') ||
        sortingCriteria.seriesSortCriteria.seriesInfoSortingCriteria,
    })
  );

  // log the error if this fails, otherwise it's so difficult to tell what went wrong...
  allRetrieves.forEach(retrieve => {
    retrieve.catch(error => {
      console.error(error);
    });
  });

  Promise.allSettled(allRetrieves).then(promises => {
    log.timeEnd(Enums.TimingEnum.STUDY_TO_DISPLAY_SETS);
    log.time(Enums.TimingEnum.DISPLAY_SETS_TO_FIRST_IMAGE);
    log.time(Enums.TimingEnum.DISPLAY_SETS_TO_ALL_IMAGES);

    const allPromises = [];
    const remainingPromises = [];

    function startRemainingPromises(remainingPromises) {
      remainingPromises.forEach(p => p.forEach(p => p.start()));
    }

    promises.forEach(promise => {
      const retrieveSeriesMetadataPromise = promise.value;
      if (Array.isArray(retrieveSeriesMetadataPromise)) {
        const { requiredSeries, remaining } = hangingProtocolService.filterSeriesRequiredForRun(
          hangingProtocolId,
          retrieveSeriesMetadataPromise
        );
        const requiredSeriesPromises = requiredSeries.map(promise => promise.start());
        allPromises.push(Promise.allSettled(requiredSeriesPromises));
        remainingPromises.push(remaining);
      }
    });

    Promise.allSettled(allPromises).then(applyHangingProtocol);
    startRemainingPromises(remainingPromises);
    applyHangingProtocol();
  });

  return unsubscriptions;
}

export default function ModeRoute({
  mode,
  dataSourceName,
  extensionManager,
  servicesManager,
  commandsManager,
  hotkeysManager,
}) {
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

  const [studyInstanceUIDs, setStudyInstanceUIDs] = useState();

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

  const { displaySetService, hangingProtocolService, userAuthenticationService } = (
    servicesManager as ServicesManager
  ).services;

  const { extensions, sopClassHandlers, hotkeys: hotkeyObj, hangingProtocol } = mode;

  const runTimeHangingProtocolId = lowerCaseSearchParams.get('hangingprotocolid');
  const token = lowerCaseSearchParams.get('token');

  if (token) {
    // if a token is passed in, set the userAuthenticationService to use it
    // for the Authorization header for all requests
    userAuthenticationService.setServiceImplementation({
      getAuthorizationHeader: () => ({
        Authorization: 'Bearer ' + token,
      }),
    });

    // Create a URL object with the current location
    const urlObj = new URL(window.location.origin + location.pathname + location.search);

    // Remove the token from the URL object
    urlObj.searchParams.delete('token');
    const cleanUrl = urlObj.toString();

    // Update the browser's history without the token
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', cleanUrl);
    }
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

  // For each extension, look up their context modules
  // TODO: move to extension manager.
  let contextModules = [];

  Object.keys(extensions).forEach(extensionId => {
    const allRegisteredModuleIds = Object.keys(extensionManager.modulesMap);
    const moduleIds = allRegisteredModuleIds.filter(id =>
      id.includes(`${extensionId}.contextModule.`)
    );

    if (!moduleIds || !moduleIds.length) {
      return;
    }

    const modules = moduleIds.map(extensionManager.getModuleEntry);
    contextModules = contextModules.concat(modules);
  });

  const contextModuleProviders = contextModules.map(a => a.provider);
  const CombinedContextProvider = ({ children }) =>
    Compose({ components: contextModuleProviders, children });

  function ViewportGridWithDataSource(props) {
    return ViewportGrid({ ...props, dataSource });
  }

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
    if (!ExtensionDependenciesLoaded) {
      return;
    }

    const retrieveLayoutData = async () => {
      const layoutData = await route.layoutTemplate({
        location,
        servicesManager,
        studyInstanceUIDs,
      });
      if (isMounted.current) {
        layoutTemplateData.current = layoutData;
        setRefresh(!refresh);
      }
    };
    if (studyInstanceUIDs?.length && studyInstanceUIDs[0] !== undefined) {
      retrieveLayoutData();
    }
    return () => {
      layoutTemplateData.current = null;
    };
  }, [studyInstanceUIDs, ExtensionDependenciesLoaded]);

  useEffect(() => {
    if (!hotkeys || !ExtensionDependenciesLoaded) {
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
  }, [ExtensionDependenciesLoaded]);

  useEffect(() => {
    if (!layoutTemplateData.current || !ExtensionDependenciesLoaded) {
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
          if (lowerVal !== 'studyinstanceuids') {
            // Not sure why the case matters here - it doesn't in the URL
            if (lowerVal === 'seriesinstanceuid') {
              const seriesUIDs = getSplitParam(lowerVal, query);
              return {
                ...acc,
                seriesInstanceUID: seriesUIDs,
              };
            }

            return { ...acc, [val]: getSplitParam(lowerVal, query) };
          }
        }, {}) ?? {};

      if (route.init) {
        return await route.init(
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
      unsubscriptions.forEach(unsub => {
        unsub();
      });
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

  const renderLayoutData = props => {
    const layoutTemplateModuleEntry = extensionManager.getModuleEntry(
      layoutTemplateData.current.id
    );
    const LayoutComponent = layoutTemplateModuleEntry.component;

    return <LayoutComponent {...props} />;
  };

  return (
    <ImageViewerProvider
      // initialState={{ StudyInstanceUIDs: StudyInstanceUIDs }}
      StudyInstanceUIDs={studyInstanceUIDs}
      // reducer={reducer}
    >
      <CombinedContextProvider>
        <DragAndDropProvider>
          {layoutTemplateData.current &&
            studyInstanceUIDs?.[0] !== undefined &&
            ExtensionDependenciesLoaded &&
            renderLayoutData({
              ...layoutTemplateData.current.props,
              ViewportGridComp: ViewportGridWithDataSource,
            })}
        </DragAndDropProvider>
      </CombinedContextProvider>
    </ImageViewerProvider>
  );
}

ModeRoute.propTypes = {
  mode: PropTypes.object.isRequired,
  dataSourceName: PropTypes.string,
  extensionManager: PropTypes.object,
  servicesManager: PropTypes.object,
  hotkeysManager: PropTypes.object,
  commandsManager: PropTypes.object,
};
