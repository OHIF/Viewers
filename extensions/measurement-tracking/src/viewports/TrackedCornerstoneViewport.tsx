import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

import { Tooltip, Icon, ViewportActionArrows, useViewportGrid } from '@ohif/ui';

import { annotation } from '@cornerstonejs/tools';
import { useTrackedMeasurements } from './../getContextModule';
import { BaseVolumeViewport, Enums } from '@cornerstonejs/core';
import { useTranslation } from 'react-i18next';

function TrackedCornerstoneViewport(props: withAppTypes) {
  const { displaySets, viewportId, servicesManager, extensionManager } = props;

  const {
    measurementService,
    cornerstoneViewportService,
    viewportGridService,
    viewportActionCornersService,
  } = servicesManager.services;

  // Todo: handling more than one displaySet on the same viewport
  const displaySet = displaySets[0];
  const { t } = useTranslation('Common');

  const [viewportGrid] = useViewportGrid();
  const { activeViewportId } = viewportGrid;

  const [trackedMeasurements, sendTrackedMeasurementsEvent] = useTrackedMeasurements();

  const [isTracked, setIsTracked] = useState(false);
  const [trackedMeasurementUID, setTrackedMeasurementUID] = useState(null);
  const [viewportElem, setViewportElem] = useState(null);

  const { trackedSeries } = trackedMeasurements.context;

  const { SeriesInstanceUID } = displaySet;

  const updateIsTracked = useCallback(() => {
    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

    if (viewport instanceof BaseVolumeViewport) {
      // A current image id will only exist for volume viewports that can have measurements tracked.
      // Typically these are those volume viewports for the series of acquisition.
      const currentImageId = viewport?.getCurrentImageId();

      if (!currentImageId) {
        if (isTracked) {
          setIsTracked(false);
        }
        return;
      }
    }

    if (trackedSeries.includes(SeriesInstanceUID) !== isTracked) {
      setIsTracked(!isTracked);
    }
  }, [isTracked, trackedMeasurements, viewportId, SeriesInstanceUID]);

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
            } = measurement;

            sendTrackedMeasurementsEvent('SET_DIRTY', { SeriesInstanceUID });
            sendTrackedMeasurementsEvent('TRACK_SERIES', {
              viewportId,
              StudyInstanceUID,
              SeriesInstanceUID,
              measurementId,
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

  useEffect(() => {
    const statusComponent = _getStatusComponent(isTracked, t);
    const arrowsComponent = _getArrowsComponent(
      isTracked,
      switchMeasurement,
      viewportId === activeViewportId
    );

    viewportActionCornersService.setComponents([
      {
        viewportId,
        id: 'viewportStatusComponent',
        component: statusComponent,
        indexPriority: -100,
        location: viewportActionCornersService.LOCATIONS.topLeft,
      },
      {
        viewportId,
        id: 'viewportActionArrowsComponent',
        component: arrowsComponent,
        indexPriority: 0,
        location: viewportActionCornersService.LOCATIONS.topRight,
      },
    ]);
  }, [activeViewportId, isTracked, switchMeasurement, viewportActionCornersService, viewportId]);

  const getCornerstoneViewport = () => {
    const { component: Component } = extensionManager.getModuleEntry(
      '@ohif/extension-cornerstone.viewportModule.cornerstone'
    );

    return (
      <Component
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
    <>
      <div className="relative flex h-full w-full flex-row overflow-hidden">
        {getCornerstoneViewport()}
      </div>
    </>
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
      className={isActiveViewport ? 'visible' : 'invisible group-hover:visible'}
    ></ViewportActionArrows>
  );
};

function _getStatusComponent(isTracked, t) {
  if (!isTracked) {
    return null;
  }

  return (
    <div className="relative">
      <Tooltip
        position="bottom-left"
        content={
          <div className="flex py-2">
            <div className="flex pt-1">
              <Icon
                name="info-link"
                className="text-primary-main w-4"
              />
            </div>
            <div className="ml-4 flex">
              <span className="text-common-light text-base">
                {isTracked ? (
                  <>{t('Series is tracked and can be viewed in the measurement panel')}</>
                ) : (
                  <>
                    {t(
                      'Measurements for untracked series will not be shown in the measurements panel'
                    )}
                  </>
                )}
              </span>
            </div>
          </div>
        }
      >
        <Icon
          name={'viewport-status-tracked'}
          className="text-aqua-pale"
        />
      </Tooltip>
    </div>
  );
}

export default TrackedCornerstoneViewport;
