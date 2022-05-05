import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import OHIF, { utils } from '@ohif/core';

import {
  Notification,
  ViewportActionBar,
  useCine,
  useViewportGrid,
  useViewportDialog,
} from '@ohif/ui';

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
  } = props;

  // Todo: handling more than one displaySet on the same viewport
  const displaySet = displaySets[0];

  const [trackedMeasurements] = useTrackedMeasurements();
  const [{ activeViewportIndex, viewports }] = useViewportGrid();
  const [{ isCineEnabled, cines }, cineService] = useCine();
  const [viewportDialogState, viewportDialogApi] = useViewportDialog();
  const [isTracked, setIsTracked] = useState(false);
  const [trackedMeasurementUID, setTrackedMeasurementUID] = useState(null);
  const { trackedSeries } = trackedMeasurements.context;

  const utilityModule = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone-3d.utilityModule.common'
  );

  const { Cornerstone3DViewportService } = utilityModule.exports;
  const viewportId = Cornerstone3DViewportService.getViewportId(viewportIndex);

  useEffect(() => {
    if (isTracked) {
      annotation.config.style.setViewportToolStyles(viewportId, {
        global: {
          lineDash: '',
        },
      });

      Cornerstone3DViewportService.getRenderingEngine().renderViewport(
        viewportId
      );

      return;
    }

    annotation.config.style.setViewportToolStyles(`viewport-${viewportIndex}`, {
      global: {
        lineDash: '4,4',
      },
    });

    Cornerstone3DViewportService.getRenderingEngine().renderViewport(
      viewportId
    );
  }, [isTracked]);

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

    const { MeasurementService } = servicesManager.services;
    MeasurementService.jumpToMeasurement(
      viewportIndex,
      newTrackedMeasurementUID
    );
  }

  const getCornerstone3DViewport = () => {
    const { component: Component } = extensionManager.getModuleEntry(
      '@ohif/extension-cornerstone-3d.viewportModule.cornerstone-3d'
    );
    return <Component {...props}></Component>;
  };

  const cine = cines[viewportIndex];
  const isPlaying = (cine && cine.isPlaying) || false;
  const frameRate = (cine && cine.frameRate) || 24;

  return (
    <>
      <ViewportActionBar
        onDoubleClick={evt => {
          evt.stopPropagation();
          evt.preventDefault();
        }}
        onSeriesChange={direction => switchMeasurement(direction)}
        studyData={{
          label: viewportLabel,
          isTracked,
          isLocked: false,
          isRehydratable: false,
          studyDate: formatDate(SeriesDate), // TODO: This is series date. Is that ok?
          currentSeries: SeriesNumber, // TODO - switch entire currentSeries to be UID based or actual position based
          seriesDescription: SeriesDescription,
          modality: Modality,
          patientInformation: {
            patientName: PatientName
              ? OHIF.utils.formatPN(PatientName.Alphabetic)
              : '',
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
        showNavArrows={!isCineEnabled}
        showCine={isCineEnabled}
        cineProps={{
          isPlaying,
          onClose: () => commandsManager.runCommand('toggleCine'),
          onPlayPauseChange: isPlaying =>
            cineService.setCine({ id: activeViewportIndex, isPlaying }),
          onFrameRateChange: frameRate =>
            cineService.setCine({ id: activeViewportIndex, frameRate }),
        }}
      />
      {/* TODO: Viewport interface to accept stack or layers of content like this? */}
      <div className="relative flex flex-row w-full h-full overflow-hidden">
        {getCornerstone3DViewport()}
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

const _viewportLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

function _getNextMeasurementUID(
  direction,
  servicesManager,
  trackedMeasurementId,
  trackedMeasurements
) {
  const { MeasurementService } = servicesManager.services;
  const measurements = MeasurementService.getMeasurements();

  const { trackedSeries } = trackedMeasurements.context;

  // Get the potentially trackable measurements for this series,
  // The measurements to jump between are the same
  // regardless if this series is tracked or not.

  const filteredMeasurements = measurements.filter(m =>
    trackedSeries.includes(m.referenceSeriesUID)
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

export default TrackedCornerstoneViewport;
