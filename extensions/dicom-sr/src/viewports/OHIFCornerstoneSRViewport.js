import React, { useCallback, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import CornerstoneViewport from 'react-cornerstone-viewport';
import OHIF, { DicomMetadataStore, utils } from '@ohif/core';
import DICOMSRDisplayTool from './../tools/DICOMSRDisplayTool';
import ViewportOverlay from './ViewportOverlay';
import {
  Notification,
  ViewportActionBar,
  useViewportGrid,
  useViewportDialog,
} from '@ohif/ui';
import TOOL_NAMES from './../constants/toolNames';
import { adapters } from 'dcmjs';
import id from './../id';

const { formatDate } = utils;
const scrollToIndex = cornerstoneTools.importInternal('util/scrollToIndex');
const globalImageIdSpecificToolStateManager =
  cornerstoneTools.globalImageIdSpecificToolStateManager;

const { StackManager, guid } = OHIF.utils;

const MEASUREMENT_TRACKING_EXTENSION_ID = 'org.ohif.measurement-tracking';

function OHIFCornerstoneSRViewport({
  children,
  dataSource,
  displaySet,
  viewportIndex,
  servicesManager,
  extensionManager,
}) {
  const {
    DisplaySetService,
    MeasurementService,
    ToolBarService,
  } = servicesManager.services;
  const [viewportGrid, viewportGridService] = useViewportGrid();
  const [viewportDialogState, viewportDialogApi] = useViewportDialog();
  const [measurementSelected, setMeasurementSelected] = useState(0);
  const [measurementCount, setMeasurementCount] = useState(1);
  const [viewportData, setViewportData] = useState(null);
  const [activeDisplaySetData, setActiveDisplaySetData] = useState({});
  const [element, setElement] = useState(null);
  const [isHydrated, setIsHydrated] = useState(displaySet.isHydrated);
  const { viewports, activeViewportIndex } = viewportGrid;

  useEffect(() => {
    const onDisplaySetsRemovedSubscription = DisplaySetService.subscribe(
      DisplaySetService.EVENTS.DISPLAY_SETS_REMOVED,
      ({ displaySetInstanceUIDs }) => {
        const activeViewport = viewports[activeViewportIndex];
        if (
          displaySetInstanceUIDs.includes(activeViewport.displaySetInstanceUID)
        ) {
          viewportGridService.setDisplaysetForViewport({
            viewportIndex: activeViewportIndex,
            displaySetInstanceUID: undefined,
          });
        }
      }
    );

    return () => {
      onDisplaySetsRemovedSubscription.unsubscribe();
    };
  }, []);

  // Optional hook into tracking extension, if present.
  let trackedMeasurements;
  let sendTrackedMeasurementsEvent;

  // TODO: this is a hook that fails if we register/de-register
  //
  if (
    extensionManager.registeredExtensionIds.includes(
      MEASUREMENT_TRACKING_EXTENSION_ID
    )
  ) {
    const contextModule = extensionManager.getModuleEntry(
      'org.ohif.measurement-tracking.contextModule.TrackedMeasurementsContext'
    );

    const useTrackedMeasurements = () => useContext(contextModule.context);

    [
      trackedMeasurements,
      sendTrackedMeasurementsEvent,
    ] = useTrackedMeasurements();
  }

  // Locked if tracking any series
  let isLocked = trackedMeasurements?.context?.trackedSeries?.length > 0;
  useEffect(() => {
    isLocked = trackedMeasurements?.context?.trackedSeries?.length > 0;
  }, [trackedMeasurements]);

  function _getToolAlias() {
    const primaryToolId = ToolBarService.state.primaryToolId;
    let toolAlias = primaryToolId;

    switch (primaryToolId) {
      case 'Length':
        toolAlias = 'SRLength';
        break;
      case 'Bidirectional':
        toolAlias = 'SRBidirectional';
        break;
      case 'ArrowAnnotate':
        toolAlias = 'SRArrowAnnotate';
        break;
      case 'EllipticalRoi':
        toolAlias = 'SREllipticalRoi';
        break;
    }

    return toolAlias;
  }

  const onElementEnabled = evt => {
    const eventData = evt.detail;
    const targetElement = eventData.element;
    const toolAlias = _getToolAlias(); // These are 1:1 for built-in only

    // ~~ MAGIC
    cornerstoneTools.addToolForElement(targetElement, DICOMSRDisplayTool);
    cornerstoneTools.setToolEnabledForElement(
      targetElement,
      TOOL_NAMES.DICOM_SR_DISPLAY_TOOL
    );

    // ~~ Variants
    cornerstoneTools.addToolForElement(
      targetElement,
      cornerstoneTools.LengthTool,
      {
        name: 'SRLength',
        configuration: {
          renderDashed: true,
        },
      }
    );
    cornerstoneTools.addToolForElement(
      targetElement,
      cornerstoneTools.ArrowAnnotateTool,
      {
        name: 'SRArrowAnnotate',
        configuration: {
          renderDashed: true,
        },
      }
    );
    cornerstoneTools.addToolForElement(
      targetElement,
      cornerstoneTools.BidirectionalTool,
      {
        name: 'SRBidirectional',
        configuration: {
          renderDashed: true,
        },
      }
    );
    cornerstoneTools.addToolForElement(
      targetElement,
      cornerstoneTools.EllipticalRoiTool,
      {
        name: 'SREllipticalRoi',
        configuration: {
          renderDashed: true,
        },
      }
    );

    // ~~ Business as usual
    cornerstoneTools.setToolActiveForElement(targetElement, 'PanMultiTouch', {
      pointers: 2,
    });
    cornerstoneTools.setToolActiveForElement(
      targetElement,
      'ZoomTouchPinch',
      {}
    );

    // TODO: Add always dashed tool alternative aliases
    // TODO: or same name... alternative config?
    cornerstoneTools.setToolActiveForElement(targetElement, toolAlias, {
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

    // TODO: Enabled Element appears to be incorrect here, it should be called
    // 'element' since it is the DOM element, not the enabledElement object
    const OHIFCornerstoneEnabledElementEvent = new CustomEvent(
      'ohif-cornerstone-enabled-element-event',
      {
        detail: {
          context: 'ACTIVE_VIEWPORT::STRUCTURED_REPORT',
          enabledElement: targetElement,
          viewportIndex,
        },
      }
    );

    document.dispatchEvent(OHIFCornerstoneEnabledElementEvent);
  };

  useEffect(() => {
    if (!displaySet.isLoaded) {
      displaySet.load();
    }
    setIsHydrated(displaySet.isHydrated);
  }, [displaySet]);

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
  }, [dataSource, displaySet]);

  const updateViewport = useCallback(newMeasurementSelected => {
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
  });

  useEffect(
    () => {
      if (element !== null) {
        setTrackingUniqueIdentifiersForElement(element);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataSource, displaySet]
  );

  useEffect(
    () => {
      updateViewport(measurementSelected);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataSource, displaySet, element]
  );

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
    SpacingBetweenSlices,
    SeriesNumber,
    displaySetInstanceUID,
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

    updateViewport(newMeasurementSelected);
  };

  const label = viewports.length > 1 ? _viewportLabels[viewportIndex] : '';

  // TODO -> disabled double click for now: onDoubleClick={_onDoubleClick}
  return (
    <>
      <ViewportActionBar
        onDoubleClick={evt => {
          evt.stopPropagation();
          evt.preventDefault();
        }}
        onPillClick={() => {
          sendTrackedMeasurementsEvent('PROMPT_HYDRATE_SR', {
            displaySetInstanceUID: displaySet.displaySetInstanceUID,
            viewportIndex,
          });
        }}
        onSeriesChange={onMeasurementChange}
        studyData={{
          label,
          useAltStyling: true,
          isTracked: false,
          isLocked,
          isRehydratable: displaySet.isRehydratable,
          isHydrated,
          studyDate: formatDate(StudyDate),
          currentSeries: SeriesNumber,
          seriesDescription: SeriesDescription,
          modality: Modality,
          patientInformation: {
            patientName: PatientName
              ? OHIF.utils.formatPN(PatientName.Alphabetic)
              : '',
            patientSex: PatientSex || '',
            patientAge: PatientAge || '',
            MRN: PatientID || '',
            thickness: SliceThickness ? `${SliceThickness.toFixed(2)}mm` : '',
            spacing:
              SpacingBetweenSlices !== undefined
                ? `${SpacingBetweenSlices.toFixed(2)}mm`
                : '',
            scanner: ManufacturerModelName || '',
          },
        }}
      />

      <div className="relative flex flex-row w-full h-full overflow-hidden">
        <CornerstoneViewport
          onElementEnabled={onElementEnabled}
          viewportIndex={viewportIndex}
          imageIds={imageIds}
          imageIdIndex={currentImageIdIndex}
          isActive={true} // todo
          isStackPrefetchEnabled={true} // todo
          isPlaying={false}
          frameRate={24}
          isOverlayVisible={true}
          // Sync resize throttle w/ sidepanel animation duration to prevent
          // seizure inducing strobe blinking effect
          resizeRefreshRateMs={150}
          viewportOverlayComponent={props => {
            return (
              <ViewportOverlay
                {...props}
                activeTools={ToolBarService.getActiveTools()}
              />
            );
          }}
        />
        <div className="absolute w-full">
          {viewportDialogState.viewportIndex === viewportIndex && (
            <Notification
              message={viewportDialogState.message}
              type={viewportDialogState.type}
              actions={viewportDialogState.actions}
              onSubmit={viewportDialogState.onSubmit}
              onOutsideClick={viewportDialogState.onOutsideClick}
            />
          )}
        </div>
        {childrenWithProps}
      </div>
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
    ManufacturerModelName: image0.ManufacturerModelName,
    SpacingBetweenSlices: image0.SpacingBetweenSlices,
    displaySetInstanceUID,
  };

  return { viewportData, activeDisplaySetData };
}

function _onDoubleClick() {
  const cancelActiveManipulatorsForElement = cornerstoneTools.getModule(
    'manipulatorState'
  ).setters.cancelActiveManipulatorsForElement;
  const enabledElements = cornerstoneTools.store.state.enabledElements;
  enabledElements.forEach(element => {
    cancelActiveManipulatorsForElement(element);
  });
}

export default OHIFCornerstoneSRViewport;
