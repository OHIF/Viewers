import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';

import CornerstoneViewport from 'react-cornerstone-viewport';
import OHIF, { utils } from '@ohif/core';
import { ViewportActionBar, useViewportGrid } from '@ohif/ui';
import TOOL_NAMES from './constants/toolNames';
import id from './id';

const { formatDate } = utils;
const scrollToIndex = cornerstoneTools.importInternal('util/scrollToIndex');

// const cine = viewportSpecificData.cine;

// isPlaying = cine.isPlaying === true;
// frameRate = cine.cineFrameRate || frameRate;

const { StackManager } = OHIF.utils;

function OHIFCornerstoneSRViewport({
  children,
  dataSource,
  displaySet,
  viewportIndex,
  DisplaySetService,
}) {
  const [viewportGrid, viewportGridService] = useViewportGrid();
  const [measurementSelected, setMeasurementSelected] = useState(0);
  const [measurementCount, setMeasurementCount] = useState(1);
  const [viewportData, setViewportData] = useState(null);
  const [activeDisplaySetData, setActiveDisplaySetData] = useState({});
  const [element, setElement] = useState(null);

  const { viewports, activeViewportIndex } = viewportGrid;

  const onElementEnabled = evt => {
    const eventData = evt.detail;
    const targetElement = eventData.element;

    // TODO -> This will only be temporary until we set a tool on, and isn't very customizable.
    // Need to discuss how to deal with tools in general in the redesign, since we
    // Previously just had Tool mode state global across the entire viewer.
    const globalTools = cornerstoneTools.store.state.globalTools;
    const globalToolNames = Object.keys(globalTools);

    globalToolNames.forEach(globalToolName => {
      cornerstoneTools.setToolDisabledForElement(targetElement, globalToolName);
    });

    cornerstoneTools.setToolEnabledForElement(
      targetElement,
      TOOL_NAMES.DICOM_SR_DISPLAY_TOOL
    );

    cornerstoneTools.setToolActiveForElement(targetElement, 'PanMultiTouch', {
      pointers: 2,
    });
    cornerstoneTools.setToolActiveForElement(
      targetElement,
      'ZoomTouchPinch',
      {}
    );

    cornerstoneTools.setToolActiveForElement(targetElement, 'Wwwc', {
      mouseButtonMask: 1,
    });
    cornerstoneTools.setToolActiveForElement(targetElement, 'Pan', {
      mouseButtonMask: 4,
    });
    cornerstoneTools.setToolActiveForElement(targetElement, 'Zoom', {
      mouseButtonMask: 2,
    });
    cornerstoneTools.setToolActiveForElement(
      targetElement,
      'StackScrollMouseWheel',
      {}
    );

    setTrackingUniqueIdentifiersForElement(targetElement);

    setElement(targetElement);
  };

  const setTrackingUniqueIdentifiersForElement = useCallback(targetElement => {
    const { measurements } = displaySet;

    const srModule = cornerstoneTools.getModule(id);

    srModule.setters.trackingUniqueIdentifiersForElement(
      targetElement,
      measurements.map(measurement => measurement.TrackingUniqueIdentifier),
      measurementSelected
    );
  });

  useEffect(() => {
    const numMeasurements = displaySet.measurements.length;

    setMeasurementCount(numMeasurements);
  }, [
    dataSource,
    displaySet,
    displaySet.StudyInstanceUID,
    displaySet.displaySetInstanceUID,
  ]);

  const updateViewport = newMeasurementSelected => {
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

    _getViewportAndActiveDisplaySetData(
      dataSource,
      displaySet,
      newMeasurementSelected,
      DisplaySetService,
      element
    ).then(({ viewportData, activeDisplaySetData }) => {
      setViewportData({ ...viewportData });
      setActiveDisplaySetData({ ...activeDisplaySetData });
      setMeasurementSelected(newMeasurementSelected);

      if (element !== null) {
        scrollToIndex(element, viewportData.stack.currentImageIdIndex);
        cornerstone.updateImage(element);
      }
    });
  };

  useEffect(() => {
    if (element !== null) {
      setTrackingUniqueIdentifiersForElement(element);
    }
  }, [
    dataSource,
    displaySet,
    displaySet.StudyInstanceUID,
    displaySet.displaySetInstanceUID,
  ]);

  useEffect(() => {
    updateViewport(measurementSelected);
  }, [
    dataSource,
    displaySet,
    displaySet.StudyInstanceUID,
    displaySet.displaySetInstanceUID,
    element,
  ]);

  const firstViewportIndexWithMatchingDisplaySetUid = viewports.findIndex(
    vp => vp.displaySetInstanceUID === displaySet.displaySetInstanceUID
  );

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

  const { Modality } = displaySet;

  // TODO -> Get this from the associated stack.

  const {
    PatientID,
    PatientName,
    PatientSex,
    PatientAge,
    SliceThickness,
    ManufacturerModelName,
    StudyDate,
    SeriesDescription,
    SeriesInstanceUID,
    PixelSpacing,
    SeriesNumber,
  } = activeDisplaySetData;

  const onMeasurementChange = direction => {
    let newMeasurementSelected = measurementSelected;

    if (direction === 'right') {
      newMeasurementSelected++;

      if (newMeasurementSelected >= measurementCount) {
        newMeasurementSelected = 0;
      }
    } else {
      newMeasurementSelected--;

      if (newMeasurementSelected < 0) {
        newMeasurementSelected = measurementCount - 1;
      }
    }

    if (newMeasurementSelected === measurementSelected) {
      // TODO -> Jump to image in this case.
    }

    updateViewport(newMeasurementSelected);
  };

  return (
    <>
      <ViewportActionBar
        onSeriesChange={onMeasurementChange}
        showNavArrows={viewportIndex === activeViewportIndex}
        studyData={{
          label: _viewportLabels[firstViewportIndexWithMatchingDisplaySetUid],
          isTracked: false,
          isLocked: false,
          studyDate: formatDate(StudyDate),
          currentSeries: SeriesNumber,
          seriesDescription: SeriesDescription,
          modality: Modality,
          patientInformation: {
            patientName: PatientName ? OHIF.utils.formatPN(PatientName.Alphabetic) : '',
            patientSex: PatientSex || '',
            patientAge: PatientAge || '',
            MRN: PatientID || '',
            thickness: `${SliceThickness}mm`,
            spacing: PixelSpacing && PixelSpacing.length ? `${PixelSpacing[0].toFixed(2)}mm x ${PixelSpacing[1].toFixed(2)}mm` : '',
            scanner: ManufacturerModelName || '',
          },
        }}
      />
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
      {childrenWithProps}
    </>
  );
}

const _viewportLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

OHIFCornerstoneSRViewport.propTypes = {
  displaySet: PropTypes.object.isRequired,
  viewportIndex: PropTypes.number.isRequired,
  dataSource: PropTypes.object,
  children: PropTypes.node,
  customProps: PropTypes.object,
};

OHIFCornerstoneSRViewport.defaultProps = {
  customProps: {},
};

/**
 * Obtain the CornerstoneTools Stack for the specified display set.
 *
 * @param {Object} displaySet
 * @param {Object} dataSource
 * @return {Object} CornerstoneTools Stack
 */
function _getCornerstoneStack(
  measurement,
  dataSource,
  DisplaySetService,
  element
) {
  const { displaySetInstanceUID, TrackingUniqueIdentifier } = measurement;

  const displaySet = DisplaySetService.getDisplaySetByUID(
    displaySetInstanceUID
  );

  // Get stack from Stack Manager
  const storedStack = StackManager.findOrCreateStack(displaySet, dataSource);

  // Clone the stack here so we don't mutate it
  const stack = Object.assign({}, storedStack);

  const { imageId } = measurement;

  stack.currentImageIdIndex = stack.imageIds.findIndex(i => i === imageId);

  if (element) {
    const srModule = cornerstoneTools.getModule(id);

    srModule.setters.activeTrackingUniqueIdentifierForElement(
      element,
      TrackingUniqueIdentifier
    );
  }

  return stack;
}

async function _getViewportAndActiveDisplaySetData(
  dataSource,
  displaySet,
  measurementSelected,
  DisplaySetService,
  element
) {
  let viewportData;

  const { measurements } = displaySet;
  const measurement = measurements[measurementSelected];

  const stack = _getCornerstoneStack(
    measurement,
    dataSource,
    DisplaySetService,
    element
  );

  viewportData = {
    StudyInstanceUID: displaySet.StudyInstanceUID,
    displaySetInstanceUID: displaySet.displaySetInstanceUID,
    stack,
  };

  const { displaySetInstanceUID } = measurement;

  const referencedDisplaySet = DisplaySetService.getDisplaySetByUID(
    displaySetInstanceUID
  );

  const image0 = referencedDisplaySet.images[0];
  const activeDisplaySetData = {
    PatientID: image0.PatientID,
    PatientName: image0.PatientName,
    PatientSex: image0.PatientSex,
    PatientAge: image0.PatientAge,
    SliceThickness: image0.SliceThickness,
    StudyDate: image0.StudyDate,
    SeriesDescription: image0.SeriesDescription,
    SeriesInstanceUID: image0.SeriesInstanceUID,
    SeriesNumber: image0.SeriesNumber,
  };

  return { viewportData, activeDisplaySetData };
}

export default OHIFCornerstoneSRViewport;
