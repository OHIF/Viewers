import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import OHIF, { utils } from '@ohif/core';

import {
  Notification,
  ViewportActionBar,
  useViewportDialog,
  Tooltip,
  Icon,
} from '@ohif/ui';

import { useTranslation } from 'react-i18next';

import { annotation } from '@cornerstonejs/tools';
import { useTrackedMeasurements } from './../getContextModule';

const { formatDate } = utils;

function TrackedCornerstoneViewport(props) {
  const {
    children,
    displaySets,
    viewportIndex,
    viewportLabel,
    servicesManager,
    extensionManager,
    commandsManager,
    viewportOptions,
  } = props;

  const { t } = useTranslation('TrackedViewport');

  const {
    measurementService,
    cornerstoneViewportService,
  } = servicesManager.services;

  // Todo: handling more than one displaySet on the same viewport
  const displaySet = displaySets[0];

  const [trackedMeasurements] = useTrackedMeasurements();
  const [viewportDialogState] = useViewportDialog();
  const [isTracked, setIsTracked] = useState(false);
  const [trackedMeasurementUID, setTrackedMeasurementUID] = useState(null);

  const { trackedSeries } = trackedMeasurements.context;
  const viewportId = viewportOptions.viewportId;

  const {
    Modality,
    SeriesDate,
    SeriesDescription,
    SeriesInstanceUID,
    SeriesNumber,
  } = displaySet;

  const {
    PatientID,
    PatientName,
    PatientSex,
    PatientAge,
    SliceThickness,
    SpacingBetweenSlices,
    ManufacturerModelName,
  } = displaySet.images[0];

  useEffect(() => {
    if (isTracked) {
      annotation.config.style.setViewportToolStyles(viewportId, {
        global: {
          lineDash: '',
        },
      });

      cornerstoneViewportService
        .getRenderingEngine()
        .renderViewport(viewportId);

      return;
    }

    annotation.config.style.setViewportToolStyles(`viewport-${viewportIndex}`, {
      global: {
        lineDash: '4,4',
      },
    });

    cornerstoneViewportService.getRenderingEngine().renderViewport(viewportId);

    return () => {
      annotation.config.style.setViewportToolStyles(viewportId, {});
    };
  }, [isTracked]);

  if (trackedSeries.includes(SeriesInstanceUID) !== isTracked) {
    setIsTracked(!isTracked);
  }

  function switchMeasurement(direction) {
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

    measurementService.jumpToMeasurement(
      viewportIndex,
      newTrackedMeasurementUID
    );
  }

  const getCornerstoneViewport = () => {
    const { component: Component } = extensionManager.getModuleEntry(
      '@ohif/extension-cornerstone.viewportModule.cornerstone'
    );

    return <Component {...props} />;
  };

  return (
    <>
      <ViewportActionBar
        onDoubleClick={evt => {
          evt.stopPropagation();
          evt.preventDefault();
        }}
        useAltStyling={isTracked}
        onArrowsClick={direction => switchMeasurement(direction)}
        getStatusComponent={() => _getStatusComponent(isTracked)}
        studyData={{
          label: viewportLabel,
          studyDate: formatDate(SeriesDate), // TODO: This is series date. Is that ok?
          currentSeries: SeriesNumber, // TODO - switch entire currentSeries to be UID based or actual position based
          seriesDescription: SeriesDescription,
          patientInformation: {
            patientName: PatientName ? OHIF.utils.formatPN(PatientName) : '',
            patientSex: PatientSex || '',
            patientAge: PatientAge || '',
            MRN: PatientID || '',
            thickness: SliceThickness
              ? `${parseFloat(SliceThickness).toFixed(2)}mm`
              : '',
            spacing:
              SpacingBetweenSlices !== undefined
                ? `${parseFloat(SpacingBetweenSlices).toFixed(2)}mm`
                : '',
            scanner: ManufacturerModelName || '',
          },
        }}
      />
      {/* TODO: Viewport interface to accept stack or layers of content like this? */}
      <div className="relative flex flex-row w-full h-full overflow-hidden">
        {getCornerstoneViewport()}
        <div className="absolute w-full">
          {viewportDialogState.viewportIndex === viewportIndex && (
            <Notification
              id={viewportDialogState.id}
              message={viewportDialogState.message}
              type={viewportDialogState.type}
              actions={viewportDialogState.actions}
              onSubmit={viewportDialogState.onSubmit}
              onOutsideClick={viewportDialogState.onOutsideClick}
            />
          )}
        </div>
      </div>
    </>
  );
}

TrackedCornerstoneViewport.propTypes = {
  displaySets: PropTypes.arrayOf(PropTypes.object.isRequired).isRequired,
  viewportIndex: PropTypes.number.isRequired,
  dataSource: PropTypes.object,
  children: PropTypes.node,
  customProps: PropTypes.object,
};

TrackedCornerstoneViewport.defaultProps = {
  customProps: {},
};

function _getNextMeasurementUID(
  direction,
  servicesManager,
  trackedMeasurementId,
  trackedMeasurements
) {
  const { measurementService, viewportGridService } = servicesManager.services;
  const measurements = measurementService.getMeasurements();

  const { activeViewportIndex, viewports } = viewportGridService.getState();
  const {
    displaySetInstanceUIDs: activeViewportDisplaySetInstanceUIDs,
  } = viewports[activeViewportIndex];

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
    if (direction === 'left') {
      measurementIndex--;

      if (measurementIndex < 0) {
        measurementIndex = measurementCount - 1;
      }
    } else if (direction === 'right') {
      measurementIndex++;

      if (measurementIndex === measurementCount) {
        measurementIndex = 0;
      }
    }
  }

  const newTrackedMeasurementId = uids[measurementIndex];

  return newTrackedMeasurementId;
}

function _getStatusComponent(isTracked) {
  const trackedIcon = isTracked ? 'status-tracked' : 'status-untracked';

  return (
    <div className="relative">
      <Tooltip
        position="bottom-left"
        content={
          <div className="flex py-2">
            <div className="flex pt-1">
              <Icon name="info-link" className="w-4 text-primary-main" />
            </div>
            <div className="flex ml-4">
              <span className="text-base text-common-light">
                {isTracked ? (
                  <>
                    Series is
                    <span className="font-bold text-white"> tracked</span> and
                    can be viewed <br /> in the measurement panel
                  </>
                ) : (
                  <>
                    Measurements for
                    <span className="font-bold text-white"> untracked </span>
                    series <br /> will not be shown in the <br /> measurements
                    panel
                  </>
                )}
              </span>
            </div>
          </div>
        }
      >
        <Icon name={trackedIcon} className="text-primary-light" />
      </Tooltip>
    </div>
  );
}

export default TrackedCornerstoneViewport;
