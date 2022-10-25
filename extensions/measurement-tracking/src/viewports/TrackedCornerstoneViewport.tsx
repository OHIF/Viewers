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

import { eventTarget, Enums } from '@cornerstonejs/core';
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

  const {
    MeasurementService,
    CornerstoneViewportService,
  } = servicesManager.services;

  // Todo: handling more than one displaySet on the same viewport
  const displaySet = displaySets[0];

  const [trackedMeasurements] = useTrackedMeasurements();
  const [{ activeViewportIndex }] = useViewportGrid();
  const [{ isCineEnabled, cines }, cineService] = useCine();
  const [viewportDialogState] = useViewportDialog();
  const [isTracked, setIsTracked] = useState(false);
  const [trackedMeasurementUID, setTrackedMeasurementUID] = useState(null);
  const [element, setElement] = useState(null);

  const { trackedSeries } = trackedMeasurements.context;

  const viewportId = CornerstoneViewportService.getViewportId(viewportIndex);

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

  const cineHandler = () => {
    if (!cines || !cines[viewportIndex] || !element) {
      return;
    }

    const cine = cines[viewportIndex];
    const isPlaying = cine.isPlaying || false;
    const frameRate = cine.frameRate || 24;

    const validFrameRate = Math.max(frameRate, 1);

    if (isPlaying) {
      cineService.playClip(element, {
        framesPerSecond: validFrameRate,
      });
    } else {
      cineService.stopClip(element);
    }
  };

  useEffect(() => {
    if (isTracked) {
      annotation.config.style.setViewportToolStyles(viewportId, {
        global: {
          lineDash: '',
        },
      });

      CornerstoneViewportService.getRenderingEngine().renderViewport(
        viewportId
      );

      return;
    }

    annotation.config.style.setViewportToolStyles(`viewport-${viewportIndex}`, {
      global: {
        lineDash: '4,4',
      },
    });

    CornerstoneViewportService.getRenderingEngine().renderViewport(viewportId);

    return () => {
      annotation.config.style.setViewportToolStyles(viewportId, {});
    };
  }, [isTracked]);

  // unmount cleanup
  useEffect(() => {
    eventTarget.addEventListener(
      Enums.Events.STACK_VIEWPORT_NEW_STACK,
      cineHandler
    );

    return () => {
      cineService.setCine({ id: viewportIndex, isPlaying: false });
      eventTarget.removeEventListener(
        Enums.Events.STACK_VIEWPORT_NEW_STACK,
        cineHandler
      );
    };
  }, [element]);

  useEffect(() => {
    if (!cines || !cines[viewportIndex] || !element) {
      return;
    }

    cineHandler();

    return () => {
      cineService.stopClip(element);
    };
  }, [cines, viewportIndex, cineService, element]);

  if (trackedSeries.includes(SeriesInstanceUID) !== isTracked) {
    setIsTracked(!isTracked);
  }

  /**
   * OnElementEnabled callback which is called after the cornerstoneExtension
   * has enabled the element. Note: we delegate all the image rendering to
   * cornerstoneExtension, so we don't need to do anything here regarding
   * the image rendering, element enabling etc.
   */
  const onElementEnabled = evt => {
    setElement(evt.detail.element);
  };

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

    MeasurementService.jumpToMeasurement(
      viewportIndex,
      newTrackedMeasurementUID
    );
  }

  const getCornerstoneViewport = () => {
    const { component: Component } = extensionManager.getModuleEntry(
      '@ohif/extension-cornerstone.viewportModule.cornerstone'
    );

    return <Component {...props} onElementEnabled={onElementEnabled} />;
  };

  const cine = cines[viewportIndex];
  const isPlaying = (cine && cine.isPlaying) || false;

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
            cineService.setCine({
              id: activeViewportIndex,
              isPlaying,
            }),
          onFrameRateChange: frameRate =>
            cineService.setCine({
              id: activeViewportIndex,
              frameRate,
            }),
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
