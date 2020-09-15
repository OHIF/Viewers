import React, { useCallback, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Machine } from 'xstate';
import { useMachine } from '@xstate/react';
import { useViewportGrid } from '@ohif/ui';
import {
  machineConfiguration,
  defaultOptions,
} from './measurementTrackingMachine';
import promptBeginTracking from './promptBeginTracking';
import promptTrackNewSeries from './promptTrackNewSeries';
import promptTrackNewStudy from './promptTrackNewStudy';
import promptSaveReport from './promptSaveReport';
import promptHydrateStructuredReport from './promptHydrateStructuredReport';
import hydrateStructuredReport from './_hydrateStructuredReport.js';

const TrackedMeasurementsContext = React.createContext();
TrackedMeasurementsContext.displayName = 'TrackedMeasurementsContext';
const useTrackedMeasurements = () => useContext(TrackedMeasurementsContext);

/**
 *
 * @param {*} param0
 */
function TrackedMeasurementsContextProvider(
  { servicesManager, extensionManager }, // Bound by consumer
  { children } // Component props
) {
  const [viewportGrid, viewportGridService] = useViewportGrid();
  const { activeViewportIndex, viewports } = viewportGrid;

  const machineOptions = Object.assign({}, defaultOptions);
  machineOptions.actions = Object.assign({}, machineOptions.actions, {
    showSeriesInActiveViewport: (ctx, evt) => {
      const { DisplaySetService } = servicesManager.services;
      const displaySetsForHydratedSeries = DisplaySetService.getDisplaySetsForSeries(
        ctx.trackedSeries[0]
      );

      if (displaySetsForHydratedSeries.length > 0) {
        const firstDisplaySetInstanceUID =
          displaySetsForHydratedSeries[0].displaySetInstanceUID;

        viewportGridService.setDisplaysetForViewport({
          viewportIndex: evt.data.viewportIndex,
          displaySetInstanceUID: firstDisplaySetInstanceUID,
        });
      }
    },
    showStructuredReportDisplaySetInActiveViewport: (ctx, evt) => {
      if (evt.data.createdDisplaySetInstanceUIDs.length > 0) {
        const StructuredReportDisplaySetInstanceUID =
          evt.data.createdDisplaySetInstanceUIDs[0].displaySetInstanceUID;

        viewportGridService.setDisplaysetForViewport({
          viewportIndex: evt.data.viewportIndex,
          displaySetInstanceUID: StructuredReportDisplaySetInstanceUID,
        });
      }
    },
    discardPreviouslyTrackedMeasurements: (ctx, evt) => {
      const { MeasurementService } = servicesManager.services;
      const measurements = MeasurementService.getMeasurements();
      const filteredMeasurements = measurements.filter(ms =>
        ctx.prevTrackedSeries.includes(ms.referenceSeriesUID)
      );
      const measurementIds = filteredMeasurements.map(fm => fm.id);

      for (let i = 0; i < measurementIds.length; i++) {
        MeasurementService.remove('app-source', measurementIds[i]);
      }
    },
    clearAllMeasurements: (ctx, evt) => {
      const { MeasurementService } = servicesManager.services;
      const measurements = MeasurementService.getMeasurements();
      const measurementIds = measurements.map(fm => fm.id);

      for (let i = 0; i < measurementIds.length; i++) {
        MeasurementService.remove('app-source', measurementIds[i]);
      }
    },
  });
  machineOptions.services = Object.assign({}, machineOptions.services, {
    promptBeginTracking: promptBeginTracking.bind(null, {
      servicesManager,
      extensionManager,
    }),
    promptTrackNewSeries: promptTrackNewSeries.bind(null, {
      servicesManager,
      extensionManager,
    }),
    promptTrackNewStudy: promptTrackNewStudy.bind(null, {
      servicesManager,
      extensionManager,
    }),
    promptSaveReport: promptSaveReport.bind(null, {
      servicesManager,
      extensionManager,
    }),
    promptHydrateStructuredReport: promptHydrateStructuredReport.bind(null, {
      servicesManager,
    }),
  });

  // TODO: IMPROVE
  // - Add measurement_updated to cornerstone; debounced? (ext side, or consumption?)
  // - Friendlier transition/api in front of measurementTracking machine?
  // - Blocked: viewport overlay shouldn't clip when resized
  // TODO: PRIORITY
  // - Fix "ellipses" series description dynamic truncate length
  // - Fix viewport border resize
  // - created/destroyed hooks for extensions (cornerstone measurement subscriptions in it's `init`)

  const measurementTrackingMachine = Machine(
    machineConfiguration,
    machineOptions
  );

  const [
    trackedMeasurements,
    sendTrackedMeasurementsEvent,
    trackedMeasurementsService,
  ] = useMachine(measurementTrackingMachine);

  // ~~ Listen for changes to ViewportGrid for potential SRs hung in panes when idle
  useEffect(() => {
    if (viewports.length > 0) {
      const activeViewport = viewports[activeViewportIndex];

      if (!activeViewport || !activeViewport.displaySetInstanceUID) {
        return;
      }

      const { DisplaySetService } = servicesManager.services;
      const displaySet = DisplaySetService.getDisplaySetByUID(
        activeViewport.displaySetInstanceUID
      );

      // Magic string
      // load function added by our sopClassHandler module
      if (
        displaySet.SOPClassHandlerId ===
          'org.ohif.dicom-sr.sopClassHandlerModule.dicom-sr' &&
        displaySet.isRehydratable === true
      ) {
        console.log('sending event...', trackedMeasurements);
        sendTrackedMeasurementsEvent('PROMPT_HYDRATE_SR', {
          displaySetInstanceUID: displaySet.displaySetInstanceUID,
          viewportIndex: activeViewportIndex,
        });
      }
    }
  }, [
    activeViewportIndex,
    sendTrackedMeasurementsEvent,
    servicesManager.services,
    viewports,
  ]);

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
  servicesManager: PropTypes.object.isRequired,
  extensionManager: PropTypes.object.isRequired,
};

export {
  TrackedMeasurementsContext,
  TrackedMeasurementsContextProvider,
  useTrackedMeasurements,
};
