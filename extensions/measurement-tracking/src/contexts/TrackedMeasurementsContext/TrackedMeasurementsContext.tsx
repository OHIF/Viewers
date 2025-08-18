import React, { useContext, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Machine } from 'xstate';
import { useMachine } from '@xstate/react';
import { useViewportGrid } from '@ohif/ui-next';
import { machineConfiguration, defaultOptions, RESPONSE } from './measurementTrackingMachine';
import { measurementTrackingMode } from './promptBeginTracking';
import hydrateStructuredReport from './hydrateStructuredReport';
import { useAppConfig } from '@state';
import {
  promptBeginTrackingWrapper,
  promptHydrateStructuredReportWrapper,
  promptTrackNewSeriesWrapper,
  promptTrackNewStudyWrapper,
  promptLabelAnnotationWrapper,
  promptSaveReportWrapper,
  promptHasDirtyAnnotationsWrapper,
} from './promptWrapperFunctions';

const TrackedMeasurementsContext = React.createContext();
TrackedMeasurementsContext.displayName = 'TrackedMeasurementsContext';
const useTrackedMeasurements = () => useContext(TrackedMeasurementsContext);

const SR_SOP_CLASS_HANDLER_ID =
  '@ohif/extension-cornerstone-dicom-sr.sopClassHandlerModule.dicom-sr';
const COMPREHENSIVE_3D_SR_SOP_CLASS_HANDLER_ID =
  '@ohif/extension-cornerstone-dicom-sr.sopClassHandlerModule.dicom-sr-3d';

const hasValidSOPClassHandlerId = displaySet => {
  return [SR_SOP_CLASS_HANDLER_ID, COMPREHENSIVE_3D_SR_SOP_CLASS_HANDLER_ID].includes(
    displaySet.SOPClassHandlerId
  );
};

/**
 *
 * @param {*} param0
 */
function TrackedMeasurementsContextProvider(
  { servicesManager, commandsManager, extensionManager }: withAppTypes, // Bound by consumer
  { children } // Component props
) {
  const [appConfig] = useAppConfig();

  const [viewportGrid, viewportGridService] = useViewportGrid();
  const { activeViewportId, viewports } = viewportGrid;
  const {
    measurementService,
    displaySetService,
    customizationService,
    trackedMeasurementsService,
  } = servicesManager.services as AppTypes.Services;

  const machineOptions = Object.assign({}, defaultOptions);
  machineOptions.actions = Object.assign({}, machineOptions.actions, {
    jumpToFirstMeasurementInActiveViewport: (ctx, evt) => {
      const { trackedStudy, trackedSeries } = ctx;
      const { viewportId: activeViewportId } = evt.data;
      const measurements = measurementService.getMeasurements();
      const trackedMeasurements = measurements.filter(
        m => trackedStudy === m.referenceStudyUID && trackedSeries.includes(m.referenceSeriesUID)
      );

      console.log(
        'jumping to measurement reset viewport',
        activeViewportId,
        trackedMeasurements[0]
      );

      const referencedDisplaySetUID = trackedMeasurements[0].displaySetInstanceUID;
      const referencedDisplaySet = displaySetService.getDisplaySetByUID(referencedDisplaySetUID);

      const referencedImages = referencedDisplaySet.images;
      const isVolumeIdReferenced = referencedImages[0].imageId.startsWith('volumeId');

      const measurementData = trackedMeasurements[0].data;

      let imageIndex = 0;
      if (!isVolumeIdReferenced && measurementData) {
        // if it is imageId referenced find the index of the imageId, we don't have
        // support for volumeId referenced images yet
        imageIndex = referencedImages.findIndex(image => {
          const imageIdToUse = Object.keys(measurementData)[0].substring(8);
          return image.imageId === imageIdToUse;
        });

        if (imageIndex === -1) {
          console.warn('Could not find image index for tracked measurement, using 0');
          imageIndex = 0;
        }
      }

      viewportGridService.setDisplaySetsForViewport({
        viewportId: activeViewportId,
        displaySetInstanceUIDs: [referencedDisplaySetUID],
        viewportOptions: {
          initialImageOptions: {
            index: imageIndex,
          },
        },
      });
    },

    jumpToSameImageInActiveViewport: (ctx, evt) => {
      const { trackedStudy, trackedSeries } = ctx;
      const { viewportId: activeViewportId } = evt.data;
      const measurements = measurementService.getMeasurements();
      const trackedMeasurements = measurements.filter(
        m => trackedStudy === m.referenceStudyUID && trackedSeries.includes(m.referenceSeriesUID)
      );

      // Jump to the last tracked measurement - most recent
      if (!trackedMeasurements?.length) {
        console.warn(
          "Didn't find any tracked measurements",
          measurements,
          trackedStudy,
          trackedSeries
        );
        return;
      }
      const trackedMeasurement = trackedMeasurements[trackedMeasurements.length - 1];
      const referencedDisplaySetUID = trackedMeasurement.displaySetInstanceUID;

      // update the previously stored positionPresentation with the new viewportId
      // presentation so that when we put the referencedDisplaySet back in the viewport
      // it will be in the correct position zoom and pan
      commandsManager.runCommand('updateStoredPositionPresentation', {
        viewportId: activeViewportId,
        displaySetInstanceUIDs: [referencedDisplaySetUID],
        referencedImageId: trackedMeasurement.referencedImageId,
      });

      viewportGridService.setDisplaySetsForViewport({
        viewportId: activeViewportId,
        displaySetInstanceUIDs: [referencedDisplaySetUID],
      });
    },
    showStructuredReportDisplaySetInActiveViewport: (ctx, evt) => {
      if (evt.data.createdDisplaySetInstanceUIDs.length > 0) {
        const StructuredReportDisplaySetInstanceUID = evt.data.createdDisplaySetInstanceUIDs[0];

        viewportGridService.setDisplaySetsForViewport({
          viewportId: evt.data.viewportId,
          displaySetInstanceUIDs: [StructuredReportDisplaySetInstanceUID],
        });
      }
    },
    discardPreviouslyTrackedMeasurements: (ctx, evt) => {
      const measurements = measurementService.getMeasurements();
      const filteredMeasurements = measurements.filter(ms =>
        ctx.prevTrackedSeries.includes(ms.referenceSeriesUID)
      );
      const measurementIds = filteredMeasurements.map(fm => fm.id);

      for (let i = 0; i < measurementIds.length; i++) {
        measurementService.remove(measurementIds[i]);
      }
    },
    clearAllMeasurements: (ctx, evt) => {
      measurementService.clearMeasurements();
      measurementService.setIsMeasurementDeletedIndividually(false);
    },
    clearDisplaySetHydratedState: (ctx, evt) => {
      const { displaySetInstanceUID } = evt.data ?? evt;

      const displaysets = displaySetService.getActiveDisplaySets();
      displaysets?.forEach(displayset => {
        if (
          displayset.Modality === 'SR' &&
          displayset.displaySetInstanceUID !== displaySetInstanceUID &&
          displayset.isHydrated
        ) {
          displayset.isHydrated = false;
          displayset.isLoaded = false;
        }
      });
    },
    updatedViewports: (ctx, evt) => {
      const { hangingProtocolService } = servicesManager.services;
      const { displaySetInstanceUID, viewportId } = evt.data ?? evt;

      const updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
        viewportId,
        displaySetInstanceUID
      );

      viewportGridService.setDisplaySetsForViewports(updatedViewports);
    },
  });
  machineOptions.services = Object.assign({}, machineOptions.services, {
    promptBeginTracking: promptBeginTrackingWrapper.bind(null, {
      servicesManager,
      extensionManager,
      appConfig,
    }),
    promptTrackNewSeries: promptTrackNewSeriesWrapper.bind(null, {
      servicesManager,
      extensionManager,
      appConfig,
    }),
    promptTrackNewStudy: promptTrackNewStudyWrapper.bind(null, {
      servicesManager,
      extensionManager,
      appConfig,
    }),
    promptSaveReport: promptSaveReportWrapper.bind(null, {
      servicesManager,
      commandsManager,
      extensionManager,
      appConfig,
    }),
    promptHydrateStructuredReport: promptHydrateStructuredReportWrapper.bind(null, {
      servicesManager,
      extensionManager,
      commandsManager,
      appConfig,
    }),
    promptHasDirtyAnnotations: promptHasDirtyAnnotationsWrapper.bind(null, {
      servicesManager,
      extensionManager,
      commandsManager,
      appConfig,
    }),
    hydrateStructuredReport: hydrateStructuredReport.bind(null, {
      servicesManager,
      extensionManager,
      commandsManager,
      appConfig,
    }),
    promptLabelAnnotation: promptLabelAnnotationWrapper.bind(null, {
      servicesManager,
      extensionManager,
      commandsManager,
    }),
  });
  machineOptions.guards = Object.assign({}, machineOptions.guards, {
    isLabelOnMeasure: (ctx, evt, condMeta) => {
      const labelConfig = customizationService.getCustomization('measurementLabels');
      return labelConfig?.labelOnMeasure;
    },
    isLabelOnMeasureAndShouldKillMachine: (ctx, evt, condMeta) => {
      const labelConfig = customizationService.getCustomization('measurementLabels');
      return evt.data && evt.data.userResponse === RESPONSE.NO_NEVER && labelConfig?.labelOnMeasure;
    },
    isSimplifiedConfig: (ctx, evt, condMeta) => {
      return appConfig?.measurementTrackingMode === measurementTrackingMode.SIMPLIFIED;
    },
    simplifiedAndLoadSR: (ctx, evt, condMeta) => {
      return (
        appConfig?.measurementTrackingMode === measurementTrackingMode.SIMPLIFIED &&
        evt.data.isBackupSave === false
      );
    },
    hasDirtyAndSimplified: (ctx, evt, condMeta) => {
      const measurements = measurementService.getMeasurements();
      const hasDirtyMeasurements =
        measurements.some(measurement => measurement.isDirty) ||
        (measurements.length && measurementService.getIsMeasurementDeletedIndividually());
      return (
        appConfig?.measurementTrackingMode === measurementTrackingMode.SIMPLIFIED &&
        hasDirtyMeasurements
      );
    },
  });

  // TODO: IMPROVE
  // - Add measurement_updated to cornerstone; debounced? (ext side, or consumption?)
  // - Friendlier transition/api in front of measurementTracking machine?
  // - Blocked: viewport overlay shouldn't clip when resized
  // TODO: PRIORITY
  // - Fix "ellipses" series description dynamic truncate length
  // - Fix viewport border resize
  // - created/destroyed hooks for extensions (cornerstone measurement subscriptions in it's `init`)

  const measurementTrackingMachine = useMemo(() => {
    return Machine(machineConfiguration, machineOptions);
  }, []); // Empty dependency array ensures this is only created once

  const [trackedMeasurements, sendTrackedMeasurementsEvent] = useMachine(
    measurementTrackingMachine
  );

  // Update TrackedMeasurementsService when trackedSeries changes in context
  useEffect(() => {
    if (trackedMeasurements?.context?.trackedSeries && trackedMeasurementsService) {
      trackedMeasurementsService.updateTrackedSeries(trackedMeasurements.context.trackedSeries);
    }
  }, [trackedMeasurements?.context?.trackedSeries, trackedMeasurementsService]);

  useEffect(() => {
    // Update the state machine with the active viewport ID
    sendTrackedMeasurementsEvent('UPDATE_ACTIVE_VIEWPORT_ID', {
      activeViewportId,
    });
  }, [activeViewportId, sendTrackedMeasurementsEvent]);

  // ~~ Listen for changes to ViewportGrid for potential SRs hung in panes when idle
  useEffect(() => {
    const triggerPromptHydrateFlow = async () => {
      if (viewports.size > 0) {
        const activeViewport = viewports.get(activeViewportId);

        if (!activeViewport || !activeViewport?.displaySetInstanceUIDs?.length) {
          return;
        }

        // Todo: Getting the first displaySetInstanceUID is wrong, but we don't have
        // tracking fusion viewports yet. This should change when we do.
        const { displaySetService } = servicesManager.services;
        const displaySet = displaySetService.getDisplaySetByUID(
          activeViewport.displaySetInstanceUIDs[0]
        );

        if (!displaySet) {
          return;
        }

        // If this is an SR produced by our SR SOPClassHandler,
        // and it hasn't been loaded yet, do that now so we
        // can check if it can be rehydrated or not.
        //
        // Note: This happens:
        // - If the viewport is not currently an OHIFCornerstoneSRViewport
        // - If the displaySet has never been hung
        //
        // Otherwise, the displaySet will be loaded by the useEffect handler
        // listening to displaySet changes inside OHIFCornerstoneSRViewport.
        // The issue here is that this handler in TrackedMeasurementsContext
        // ends up occurring before the Viewport is created, so the displaySet
        // is not loaded yet, and isRehydratable is undefined unless we call load().
        if (hasValidSOPClassHandlerId(displaySet) && !displaySet.isLoaded && displaySet.load) {
          await displaySet.load();
        }

        // Magic string
        // load function added by our sopClassHandler module
        if (
          hasValidSOPClassHandlerId(displaySet) &&
          displaySet.isRehydratable === true &&
          !displaySet.isHydrated
        ) {
          const params = {
            displaySetInstanceUID: displaySet.displaySetInstanceUID,
            SeriesInstanceUID: displaySet.SeriesInstanceUID,
            viewportId: activeViewportId,
          };

          // Check if we should bypass the confirmation prompt
          const disableConfirmationPrompts = appConfig?.disableConfirmationPrompts;

          if (disableConfirmationPrompts) {
            sendTrackedMeasurementsEvent('HYDRATE_SR', params);
          } else {
            sendTrackedMeasurementsEvent('PROMPT_HYDRATE_SR', params);
          }
        }
      }
    };
    triggerPromptHydrateFlow();
  }, [
    trackedMeasurements,
    activeViewportId,
    sendTrackedMeasurementsEvent,
    servicesManager.services,
    viewports,
    appConfig,
  ]);

  useEffect(() => {
    // The command needs to be bound to the context's sendTrackedMeasurementsEvent
    // so the command has to be registered in a React component.
    commandsManager.registerCommand('DEFAULT', 'loadTrackedSRMeasurements', {
      commandFn: props => sendTrackedMeasurementsEvent('HYDRATE_SR', props),
    });
  }, [commandsManager, sendTrackedMeasurementsEvent]);

  return (
    <TrackedMeasurementsContext.Provider
      value={[trackedMeasurements, sendTrackedMeasurementsEvent]}
    >
      {children}
    </TrackedMeasurementsContext.Provider>
  );
}

TrackedMeasurementsContextProvider.propTypes = {
  children: PropTypes.oneOf([PropTypes.func, PropTypes.node]),
  appConfig: PropTypes.object,
};

export { TrackedMeasurementsContext, TrackedMeasurementsContextProvider, useTrackedMeasurements };
