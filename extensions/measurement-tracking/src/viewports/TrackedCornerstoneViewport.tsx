import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import OHIF, { utils } from '@ohif/core';
import {
  Notification,
  ViewportActionBar,
  useCine,
  useViewportGrid,
  useViewportDialog,
} from '@ohif/ui';
import { useTrackedMeasurements } from './../getContextModule';
import setCornerstoneMeasurementActive from '../_shared/setCornerstoneMeasurementActive';
import setActiveAndPassiveToolsForElement from '../_shared/setActiveAndPassiveToolsForElement';
import getTools from '../_shared/getTools';

const { formatDate } = utils;

function TrackedCornerstoneViewport(props) {
  const {
    children,
    dataSource,
    displaySets,
    viewportIndex,
    servicesManager,
    extensionManager,
    commandsManager,
  } = props;

  // Todo: handling more than one displaySet on the same viewport
  const displaySet = displaySets[0];

  const { ToolBarService } = servicesManager.services;

  const [trackedMeasurements] = useTrackedMeasurements();
  const [
    { activeViewportIndex, viewports },
    viewportGridService,
  ] = useViewportGrid();
  const [{ isCineEnabled, cines }, cineService] = useCine();
  const [viewportDialogState, viewportDialogApi] = useViewportDialog();
  const [isTracked, setIsTracked] = useState(false);
  const [trackedMeasurementId, setTrackedMeasurementId] = useState(null);
  const [element, setElement] = useState(null);

  /*
  const onElementEnabled = evt => {
    const eventData = evt.detail;
    const targetElement = eventData.element;
    const tools = getTools();
    const toolAlias = ToolBarService.state.primaryToolId;

    // Activate appropriate tool bindings for element
    setActiveAndPassiveToolsForElement(targetElement, tools);
    cornerstoneTools.setToolActiveForElement(targetElement, toolAlias, {
      mouseButtonMask: 1,
    });

    // Set dashed, based on tracking, for this viewport
    const allTools = cornerstoneTools.store.state.tools;
    const toolsForElement = allTools.filter(
      tool => tool.element === targetElement
    );

    toolsForElement.forEach(tool => {
      if (
        tool instanceof ArrowAnnotateTool ||
        tool instanceof BidirectionalTool ||
        tool instanceof EllipticalRoiTool ||
        tool instanceof LengthTool
      ) {
        const configuration = tool.configuration;

        configuration.renderDashed = !isTracked;

        tool.configuration = configuration;
      } else if (tool instanceof BaseAnnotationTool) {
        const configuration = tool.configuration;

        configuration.renderDashed = true;

        tool.configuration = configuration;
      }
    });

    // Update image after setting tool config
    const enabledElement = cornerstone.getEnabledElement(targetElement);

    if (enabledElement.image) {
      cornerstone.updateImage(targetElement);
    }

    setElement(targetElement);

    const OHIFCornerstoneEnabledElementEvent = new CustomEvent(
      'ohif-cornerstone-enabled-element-event',
      {
        detail: {
          context: 'ACTIVE_VIEWPORT::TRACKED',
          enabledElement: targetElement,
          viewportIndex,
        },
      }
    );

    document.dispatchEvent(OHIFCornerstoneEnabledElementEvent);
  };
  */

  /*
  useEffect(() => {
    if (!element) {
      return;
    }
    const allTools = cornerstoneTools.store.state.tools;
    const toolsForElement = allTools.filter(tool => tool.element === element);

    toolsForElement.forEach(tool => {
      if (
        tool instanceof ArrowAnnotateTool ||
        tool instanceof BidirectionalTool ||
        tool instanceof EllipticalRoiTool ||
        tool instanceof LengthTool
      ) {
        const configuration = tool.configuration;

        configuration.renderDashed = !isTracked;

        tool.configuration = configuration;
      }
    });

    const enabledElement = cornerstone.getEnabledElement(element);

    if (enabledElement.image) {
      cornerstone.updateImage(element);
    }
  }, [isTracked]);
  */

  // We have...
  // StudyInstanceUid, DisplaySetInstanceUid
  // Use displaySetInstanceUid --> SeriesInstanceUid
  // Get meta for series, map to actionBar
  // const displaySet = DisplaySetService.getDisplaySetByUID(
  //   dSet.displaySetInstanceUID
  // );
  // TODO: This display contains the meta for all instances.
  // That can't be right...
  // console.log('DISPLAYSET', displaySet);
  // const seriesMeta = DicomMetadataStore.getSeries(this.props.displaySet.StudyInstanceUID, '');
  // console.log(seriesMeta);

  // TODO: Share this logic so it isn't out of sync where we retrieve
  const firstViewportIndexWithMatchingDisplaySetUid = viewports.findIndex(vp =>
    vp.displaySetInstanceUIDs.includes(displaySet.displaySetInstanceUID)
  );
  const { trackedSeries } = trackedMeasurements.context;

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

  const label = viewports.length > 1 ? _viewportLabels[viewportIndex] : '';

  function switchMeasurement(direction) {
    if (!element) {
      // Element not yet enabled.
      return;
    }

    const newTrackedMeasurementId = _getNextMeasurementId(
      direction,
      servicesManager,
      trackedMeasurementId,
      trackedMeasurements
    );

    if (!newTrackedMeasurementId) {
      return;
    }

    setTrackedMeasurementId(newTrackedMeasurementId);

    const { MeasurementService } = servicesManager.services;
    const measurements = MeasurementService.getMeasurements();
    const measurement = measurements.find(
      m => m.id === newTrackedMeasurementId
    );

    setCornerstoneMeasurementActive(measurement);

    MeasurementService.jumpToMeasurement(
      viewportIndex,
      newTrackedMeasurementId
    );
  }

  const renderViewport = () => {
    const { component: Component } = extensionManager.getModuleEntry(
      '@ohif/extension-cornerstone-3d.viewportModule.cornerstone-3d'
    );
    return <Component element={element} {...props}></Component>;
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
          label,
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
        {renderViewport()}
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

function _getNextMeasurementId(
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

  const ids = filteredMeasurements.map(fm => fm.id);
  let measurementIndex = ids.findIndex(id => id === trackedMeasurementId);

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

  const newTrackedMeasurementId = ids[measurementIndex];

  return newTrackedMeasurementId;
}

export default TrackedCornerstoneViewport;
