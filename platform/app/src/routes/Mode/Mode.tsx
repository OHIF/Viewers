import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation } from 'react-router';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { utils, DicomMetadataStore } from '@ohif/core';
import { ImageViewerProvider, DragAndDropProvider } from '@ohif/ui-next';
import { useSearchParams } from '../../hooks';
import { useAppConfig } from '@state';
import ViewportGrid from '@components/ViewportGrid';
import Compose from './Compose';
import loadModules from '../../pluginImports';
import { defaultRouteInit } from './defaultRouteInit';
import { updateAuthServiceAndCleanUrl } from './updateAuthServiceAndCleanUrl';

const { getSplitParam } = utils;

/**
 * Publishes imagingstudy-open events for the given study instance UIDs
 * @param {string[]} studyInstanceUIDs - Array of study instance UIDs
 * @param {object} servicesManager - Services manager instance
 * @param {object} commandsManager - Commands manager instance
 */
function publishImagingStudyOpenEvents(studyInstanceUIDs, servicesManager, commandsManager) {
  try {
    const castService = servicesManager.services.castService;
    if (!castService) {
      console.debug('Mode: CastService not available, skipping imagingstudy-open');
      return;
    }

    const hub = castService.getHub();
    if (!hub || !hub.subscribed || !hub.name) {
      console.debug('Mode: Hub not configured or not subscribed, skipping imagingstudy-open');
      return;
    }

    // Use DicomMetadataStore to get study data and create message inline

    // Publish event for each study
    if (studyInstanceUIDs && Array.isArray(studyInstanceUIDs)) {
      studyInstanceUIDs.forEach(studyInstanceUID => {
        const study = DicomMetadataStore.getStudy(studyInstanceUID);
        if (!study) {
          console.warn('Mode: Study not found in metadata store:', studyInstanceUID);
          return;
        }

        // Get patient information from the first instance of the first series
        let patientId = '';
        let patientName = '';
        let accessionNumber = '';

        if (study.series && study.series.length > 0) {
          const firstSeries = study.series[0];
          if (firstSeries.instances && firstSeries.instances.length > 0) {
            const firstInstance = firstSeries.instances[0];
            patientId = firstInstance.PatientID || '';
            patientName = firstInstance.PatientName || '';
            accessionNumber = firstInstance.AccessionNumber || study.AccessionNumber || '';
          }
        }

        const patientIdentifierValue = patientId || 'unknown';

        const castMessage = {
          timestamp: '',
          id: '',
          event: {
            'hub.topic': '',
            'hub.event': 'imagingstudy-open',
            context: [
              {
                key: 'patient',
                resource: {
                  resourceType: 'Patient',
                  id: patientIdentifierValue,
                  identifier: [
                    {
                      system: 'urn:oid:2.16.840.1.113883.4.2',
                      value: patientIdentifierValue,
                    },
                  ],
                  name: patientName ? [{ text: patientName }] : undefined,
                },
              },
              {
                key: 'study',
                resource: {
                  resourceType: 'ImagingStudy',
                  id: studyInstanceUID,
                  uid: 'urn:oid:' + studyInstanceUID,
                  identifier: accessionNumber
                    ? [
                        {
                          system: 'urn:oid:2.16.840.1.113883.4.2',
                          value: accessionNumber,
                        },
                      ]
                    : [],
                  patient: {
                    reference: 'Patient/' + patientIdentifierValue,
                  },
                  status: 'available',
                },
              },
            ],
          },
        };

        console.debug('Mode: Publishing imagingstudy-open for study:', studyInstanceUID);
        castService.castPublish(castMessage, hub).catch(err => {
          console.warn('Mode: Failed to publish imagingstudy-open event:', err);
        });
      });
    }
  } catch (error) {
    // Silently fail if cast extension is not available
    console.debug('Mode: Could not publish imagingstudy-open events:', error.message);
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
      const loadedExtensions = await loadModules(Object.keys(extensions));
      for (const extension of loadedExtensions) {
        const { id: extensionId } = extension;
        if (extensionManager.registeredExtensionIds.indexOf(extensionId) === -1) {
          await extensionManager.registerExtension(extension);
        }
      }

      if (isMounted.current) {
        setExtensionDependenciesLoaded(true);
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

  /**
   * Validates study existence before loading the viewer.
   * Moved from PanelStudyBrowser.tsx to ensure validation runs in all modes
   */
  useEffect(() => {
    if (!ExtensionDependenciesLoaded || !studyInstanceUIDs?.length || !dataSource) {
      return;
    }

    const validateStudies = async () => {
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
    };

    validateStudies();
  }, [studyInstanceUIDs, ExtensionDependenciesLoaded, dataSource, navigate]);

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

      // Publish imagingstudy-open events for opened studies
      publishImagingStudyOpenEvents(studyInstanceUIDs, servicesManager, commandsManager);
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

ModeRoute.propTypes = {
  mode: PropTypes.object.isRequired,
  dataSourceName: PropTypes.string,
  extensionManager: PropTypes.object,
  servicesManager: PropTypes.object,
  hotkeysManager: PropTypes.object,
  commandsManager: PropTypes.object,
};
