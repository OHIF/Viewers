import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

import { ViewportActionArrows } from '@ohif/ui-next';
import { OHIFCornerstoneViewport } from '@ohif/extension-cornerstone';

import { annotation } from '@cornerstonejs/tools';
import { useTrackedMeasurements } from './../getContextModule';
import { BaseVolumeViewport, Enums } from '@cornerstonejs/core';
import { useSystem } from '@ohif/core';

function TrackedCornerstoneViewport(
  props: withAppTypes<{ viewportId: string; displaySets: AppTypes.DisplaySet[] }>
) {
  const { servicesManager } = useSystem();
  const { displaySets, viewportId } = props as {
    displaySets: AppTypes.DisplaySet[];
    viewportId: string;
    servicesManager: AppTypes.Services;
  };

  const { measurementService, cornerstoneViewportService, viewportGridService, toolbarService } =
    servicesManager.services;

  // Todo: handling more than one displaySet on the same viewport
  const displaySet = displaySets[0];
  const [trackedMeasurements, sendTrackedMeasurementsEvent] = useTrackedMeasurements();

  const [isTracked, setIsTracked] = useState(false);
  const [trackedMeasurementUID, setTrackedMeasurementUID] = useState(null);
  const [viewportElem, setViewportElem] = useState(null);

  const { trackedSeries } = trackedMeasurements.context;

  const { SeriesInstanceUID } = displaySet;

  const updateIsTracked = useCallback(() => {
    if (trackedSeries.includes(SeriesInstanceUID) !== isTracked) {
      setIsTracked(!isTracked);
    }
  }, [isTracked, SeriesInstanceUID, trackedSeries]);

  const onElementEnabled = useCallback(
    evt => {
      if (evt.detail.element !== viewportElem) {
        // The VOLUME_VIEWPORT_NEW_VOLUME event allows updateIsTracked to reliably fetch the image id for a volume viewport.
        evt.detail.element?.addEventListener(
          Enums.Events.VOLUME_VIEWPORT_NEW_VOLUME,
          updateIsTracked
        );
        setViewportElem(evt.detail.element);
      }
    },
    [updateIsTracked, viewportElem]
  );

  const onElementDisabled = useCallback(() => {
    viewportElem?.removeEventListener(Enums.Events.VOLUME_VIEWPORT_NEW_VOLUME, updateIsTracked);
  }, [updateIsTracked, viewportElem]);

  useEffect(updateIsTracked, [updateIsTracked]);

  useEffect(() => {
    const { unsubscribe } = cornerstoneViewportService.subscribe(
      cornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED,
      props => {
        if (props.viewportId !== viewportId) {
          return;
        }

        updateIsTracked();
      }
    );

    return () => {
      unsubscribe();
    };
  }, [updateIsTracked, viewportId]);

  useEffect(() => {
    if (isTracked) {
      annotation.config.style.setViewportToolStyles(viewportId, {
        ReferenceLines: {
          lineDash: '4,4',
        },
        global: {
          lineDash: '',
        },
      });

      cornerstoneViewportService.getRenderingEngine().renderViewport(viewportId);

      return;
    }

    annotation.config.style.setViewportToolStyles(viewportId, {
      global: {
        lineDash: '4,4',
      },
    });

    cornerstoneViewportService.getRenderingEngine().renderViewport(viewportId);

    return () => {
      annotation.config.style.setViewportToolStyles(viewportId, {});
    };
  }, [isTracked]);

  /**
   * The effect for listening to measurement service measurement added events
   * and in turn firing an event to update the measurement tracking state machine.
   * The TrackedCornerstoneViewport is the best place for this because when
   * a measurement is added, at least one TrackedCornerstoneViewport will be in
   * the DOM and thus can react to the events fired.
   */
  useEffect(() => {
    const added = measurementService.EVENTS.MEASUREMENT_ADDED;
    const addedRaw = measurementService.EVENTS.RAW_MEASUREMENT_ADDED;
    const subscriptions = [];

    [added, addedRaw].forEach(evt => {
      subscriptions.push(
        measurementService.subscribe(evt, ({ source, measurement }) => {
          const { activeViewportId } = viewportGridService.getState();

          // Each TrackedCornerstoneViewport receives the MeasurementService's events.
          // Only send the tracked measurements event for the active viewport to avoid
          // sending it more than once.
          if (viewportId === activeViewportId) {
            const {
              referenceStudyUID: StudyInstanceUID,
              referenceSeriesUID: SeriesInstanceUID,
              uid: measurementId,
              toolName,
            } = measurement;

            sendTrackedMeasurementsEvent('SET_DIRTY', { SeriesInstanceUID });
            sendTrackedMeasurementsEvent('TRACK_SERIES', {
              viewportId,
              StudyInstanceUID,
              SeriesInstanceUID,
              measurementId,
              toolName,
            });
          }
        }).unsubscribe
      );
    });

    return () => {
      subscriptions.forEach(unsub => {
        unsub();
      });
    };
  }, [measurementService, sendTrackedMeasurementsEvent, viewportId, viewportGridService]);

  const switchMeasurement = useCallback(
    direction => {
      const newTrackedMeasurementUID = _getNextMeasurementUID(
        direction,
        servicesManager,
        trackedMeasurementUID,
        trackedMeasurements
      );

      if (!newTrackedMeasurementUID) {
        return;
      }

      setTrackedMeasurementUID(newTrackedMeasurementUID);

      measurementService.jumpToMeasurement(viewportId, newTrackedMeasurementUID);
    },
    [measurementService, servicesManager, trackedMeasurementUID, trackedMeasurements, viewportId]
  );

  const getCornerstoneViewport = () => {
    return (
      <OHIFCornerstoneViewport
        {...props}
        onElementEnabled={evt => {
          props.onElementEnabled?.(evt);
          onElementEnabled(evt);
        }}
        onElementDisabled={onElementDisabled}
      />
    );
  };

  return (
    <div className="relative flex h-full w-full flex-row overflow-hidden">
      {getCornerstoneViewport()}
    </div>
  );
}

TrackedCornerstoneViewport.propTypes = {
  displaySets: PropTypes.arrayOf(PropTypes.object.isRequired).isRequired,
  viewportId: PropTypes.string.isRequired,
  dataSource: PropTypes.object,
  children: PropTypes.node,
};

function _getNextMeasurementUID(
  direction,
  servicesManager: AppTypes.ServicesManager,
  trackedMeasurementId,
  trackedMeasurements
) {
  const { measurementService, viewportGridService } = servicesManager.services;
  const measurements = measurementService.getMeasurements();

  const { activeViewportId, viewports } = viewportGridService.getState();
  const { displaySetInstanceUIDs: activeViewportDisplaySetInstanceUIDs } =
    viewports.get(activeViewportId);

  const { trackedSeries } = trackedMeasurements.context;

  // Get the potentially trackable measurements for the series of the
  // active viewport.
  // The measurements to jump between are the same
  // regardless if this series is tracked or not.

  const filteredMeasurements = measurements.filter(
    m =>
      trackedSeries.includes(m.referenceSeriesUID) &&
      activeViewportDisplaySetInstanceUIDs.includes(m.displaySetInstanceUID)
  );

  if (!filteredMeasurements.length) {
    // No measurements on this series.
    return;
  }

  const measurementCount = filteredMeasurements.length;

  const uids = filteredMeasurements.map(fm => fm.uid);
  let measurementIndex = uids.findIndex(uid => uid === trackedMeasurementId);

  if (measurementIndex === -1) {
    // Not tracking a measurement, or previous measurement now deleted, revert to 0.
    measurementIndex = 0;
  } else {
    measurementIndex += direction;
    if (measurementIndex < 0) {
      measurementIndex = measurementCount - 1;
    } else if (measurementIndex === measurementCount) {
      measurementIndex = 0;
    }
  }

  const newTrackedMeasurementId = uids[measurementIndex];

  return newTrackedMeasurementId;
}

const _getArrowsComponent = (isTracked, switchMeasurement, isActiveViewport) => {
  if (!isTracked) {
    return null;
  }

  return (
    <ViewportActionArrows
      onArrowsClick={direction => switchMeasurement(direction)}
      className={isActiveViewport ? 'visible' : 'invisible group-hover/pane:visible'}
    />
  );
};

export default TrackedCornerstoneViewport;
