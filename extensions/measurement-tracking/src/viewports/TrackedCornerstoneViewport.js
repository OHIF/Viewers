import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import CornerstoneViewport from 'react-cornerstone-viewport';
import OHIF, { DicomMetadataStore } from '@ohif/core';
import {
  Notification,
  ViewportActionBar,
  useViewportGrid,
  useViewportDialog,
} from '@ohif/ui';
import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';
import { useTrackedMeasurements } from './../getContextModule';
import jumpToNextAnnotation from './utils/jumpToNextAnnotation';

// TODO -> Get this list from the list of tracked measurements.
const {
  ArrowAnnotateTool,
  BidirectionalTool,
  EllipticalRoiTool,
  LengthTool,
} = cornerstoneTools;

const BaseAnnotationTool = cornerstoneTools.importInternal(
  'base/BaseAnnotationTool'
);

// const cine = viewportSpecificData.cine;

// isPlaying = cine.isPlaying === true;
// frameRate = cine.cineFrameRate || frameRate;

const { StackManager } = OHIF.utils;

function TrackedCornerstoneViewport({
  children,
  dataSource,
  displaySet,
  viewportIndex,
  servicesManager,
}) {
  const [trackedMeasurements] = useTrackedMeasurements();

  const [trackedMeasurementId, setTrackedMeasurementId] = useState(null);

  const [
    { activeViewportIndex, viewports },
    dispatchViewportGrid,
  ] = useViewportGrid();
  // viewportIndex, onSubmit
  const [viewportDialogState, viewportDialogApi] = useViewportDialog();
  const [viewportData, setViewportData] = useState(null);
  const [element, setElement] = useState(null);
  const [isTracked, setIsTracked] = useState(false);
  // TODO: Still needed? Better way than import `OHIF` and destructure?
  // Why is this managed by `core`?
  useEffect(() => {
    return () => {
      StackManager.clearStacks();
    };
  }, []);

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

  const onElementEnabled = evt => {
    const eventData = evt.detail;
    const targetElement = eventData.element;

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

    const enabledElement = cornerstone.getEnabledElement(targetElement);

    if (enabledElement.image) {
      cornerstone.updateImage(targetElement);
    }

    setElement(targetElement);
  };

  useEffect(() => {
    const {
      StudyInstanceUID,
      displaySetInstanceUID,
      sopClassUids,
    } = displaySet;

    if (!StudyInstanceUID || !displaySetInstanceUID) {
      return;
    }

    if (sopClassUids && sopClassUids.length > 1) {
      console.warn(
        'More than one SOPClassUID in the same series is not yet supported.'
      );
    }

    _getViewportData(dataSource, displaySet).then(viewportData => {
      setViewportData({ ...viewportData });
    });
  }, [
    dataSource,
    displaySet,
    displaySet.StudyInstanceUID,
    displaySet.displaySetInstanceUID,
    displaySet.frameIndex,
  ]);

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  let childrenWithProps = null;

  if (!viewportData) {
    return null;
  }

  const {
    imageIds,
    currentImageIdIndex,
    // If this comes from the instance, would be a better default
    // `FrameTime` in the instance
    // frameRate = 0,
  } = viewportData.stack;

  // TODO: Does it make more sense to use Context?
  if (children && children.length) {
    childrenWithProps = children.map((child, index) => {
      return (
        child &&
        React.cloneElement(child, {
          viewportIndex,
          key: index,
        })
      );
    });
  }

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
  const firstViewportIndexWithMatchingDisplaySetUid = viewports.findIndex(
    vp => vp.displaySetInstanceUID === displaySet.displaySetInstanceUID
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
  } = displaySet.images[0];

  if (trackedSeries.includes(SeriesInstanceUID) !== isTracked) {
    setIsTracked(!isTracked);
  }

  /**
   * If the series is tracked, jumps through tracked measurements in this series.
   * if the series is not tracked, jumps through potentially trackable measurements
   * (those tracked by the MeasurementService.)
   * @param {string} direction 'right' or 'left' navigation through the measurements.
   */
  function switchMeasurement(direction) {
    if (!element) {
      // Element not yet enabled.
      return;
    }

    const newTrackedMeasurementId = _switchMeasurementAndGetMeasurementId(
      direction,
      element,
      SeriesInstanceUID,
      servicesManager,
      trackedMeasurementId
    );

    setTrackedMeasurementId(newTrackedMeasurementId);
  }

  return (
    <>
      <ViewportActionBar
        onNavigationClick={switchMeasurement}
        showPatientInfo={viewportIndex === activeViewportIndex}
        showNavArrows={viewportIndex === activeViewportIndex}
        studyData={{
          label: _viewportLabels[firstViewportIndexWithMatchingDisplaySetUid],
          isTracked: trackedSeries.includes(SeriesInstanceUID),
          isLocked: false,
          studyDate: SeriesDate, // TODO: This is series date. Is that ok?
          currentSeries: SeriesNumber,
          seriesDescription: SeriesDescription,
          modality: Modality,
          patientInformation: {
            patientName: PatientName ? PatientName.Alphabetic || '' : '',
            patientSex: PatientSex || '',
            patientAge: PatientAge || '',
            MRN: PatientID || '',
            thickness: `${SliceThickness}mm`,
            spacing: '',
            scanner: '',
          },
        }}
      />
      {/* TODO: Viewport interface to accept stack or layers of content like this? */}
      <div className="relative flex flex-row w-full h-full">
        <CornerstoneViewport
          onElementEnabled={onElementEnabled}
          viewportIndex={viewportIndex}
          imageIds={imageIds}
          imageIdIndex={currentImageIdIndex}
          // TODO: ViewportGrid Context?
          isActive={true} // todo
          isStackPrefetchEnabled={true} // todo
          isPlaying={false}
          frameRate={24}
          isOverlayVisible={false}
        />
        <div className="absolute w-full">
          {viewportDialogState.viewportIndex === viewportIndex && (
            <Notification
              message={viewportDialogState.message}
              type={viewportDialogState.type}
              actions={viewportDialogState.actions}
              onSubmit={viewportDialogState.onSubmit}
            />
          )}
        </div>
        {childrenWithProps}
      </div>
    </>
  );
}

TrackedCornerstoneViewport.propTypes = {
  displaySet: PropTypes.object.isRequired,
  viewportIndex: PropTypes.number.isRequired,
  dataSource: PropTypes.object,
  children: PropTypes.node,
  customProps: PropTypes.object,
};

TrackedCornerstoneViewport.defaultProps = {
  customProps: {},
};

const _viewportLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

/**
 * Obtain the CornerstoneTools Stack for the specified display set.
 *
 * @param {Object} displaySet
 * @param {Object} dataSource
 * @return {Object} CornerstoneTools Stack
 */
function _getCornerstoneStack(displaySet, dataSource) {
  const { frameIndex } = displaySet;

  // Get stack from Stack Manager
  const storedStack = StackManager.findOrCreateStack(displaySet, dataSource);

  // Clone the stack here so we don't mutate it
  const stack = Object.assign({}, storedStack);

  stack.currentImageIdIndex = frameIndex;

  return stack;
}

async function _getViewportData(dataSource, displaySet) {
  let viewportData;

  const stack = _getCornerstoneStack(displaySet, dataSource);

  viewportData = {
    StudyInstanceUID: displaySet.StudyInstanceUID,
    displaySetInstanceUID: displaySet.displaySetInstanceUID,
    stack,
  };

  return viewportData;
}

export default TrackedCornerstoneViewport;

function _switchMeasurementAndGetMeasurementId(
  direction,
  element,
  SeriesInstanceUID,
  servicesManager,
  trackedMeasurementId
) {
  const { MeasurementService } = servicesManager.services;
  const measurements = MeasurementService.getMeasurements();

  // Get the potentially trackable measurements for this series,
  // The measurements to jump between are the same
  // regardless if this series is tracked or not.

  const filteredMeasurements = measurements.filter(
    m => m.referencedSeriesUID === SeriesInstanceUID
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
  }

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


  const newTrackedMeasurementId = ids[measurementIndex];

  jumpToNextAnnotation(trackedMeasurementId, newTrackedMeasurementId, element);

  return newTrackedMeasurementId;
}
