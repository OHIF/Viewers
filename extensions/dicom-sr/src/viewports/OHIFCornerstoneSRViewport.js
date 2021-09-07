import React, { useCallback, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import CornerstoneViewport from 'react-cornerstone-viewport';
import OHIF, { utils } from '@ohif/core';
import {
  Notification,
  ViewportActionBar,
  useViewportGrid,
  useViewportDialog,
} from '@ohif/ui';

/** Internal imports */
import ViewportOverlay from './ViewportOverlay';
import id from './../id';
import initSRTools from '../tools/initSRTools';

const { formatDate } = utils;
const { StackManager } = OHIF.utils;
const MEASUREMENT_TRACKING_EXTENSION_ID = 'org.ohif.measurement-tracking';

/** Cornerstone 3rd party dev kit imports */
const scrollToIndex = cornerstoneTools.importInternal('util/scrollToIndex');

function OHIFCornerstoneSRViewport({
  children,
  dataSource,
  displaySet,
  viewportIndex,
  servicesManager,
  extensionManager,
}) {
  const { DisplaySetService, ToolBarService } = servicesManager.services;
  const [viewportGrid, viewportGridService] = useViewportGrid();
  const [viewportDialogState, viewportDialogApi] = useViewportDialog();
  const [measurementSelected, setMeasurementSelected] = useState(0);
  const [measurementCount, setMeasurementCount] = useState(1);
  const [viewportData, setViewportData] = useState(null);
  const [activeDisplaySetData, setActiveDisplaySetData] = useState({});
  const [element, setElement] = useState(null);
  const [isHydrated, setIsHydrated] = useState(displaySet.isHydrated);
  const { viewports, activeViewportIndex } = viewportGrid;

  /**
   * Empty SR viewport if display set removed.
   */
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

  /**
   * Optional hook into tracking extension, if present.
   */
  let trackedMeasurements;
  let sendTrackedMeasurementsEvent;

  /**
   * TODO: this is a hook that fails if we register/de-register.
   */
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

  /**
   * Locked if tracking any series
   */
  let isLocked = trackedMeasurements?.context?.trackedSeries?.length > 0;
  useEffect(() => {
    isLocked = trackedMeasurements?.context?.trackedSeries?.length > 0;
  }, [trackedMeasurements]);

  const onElementEnabled = evt => {
    const eventData = evt.detail;
    const targetElement = eventData.element;

    /**
     * Initialize SR cornerstone tools.
     */
    initSRTools(targetElement, ToolBarService);

    setTrackingUniqueIdentifiersForElement(
      targetElement,
      displaySet,
      measurementSelected
    );
    setElement(targetElement);

    /**
     * TODO: Enabled Element appears to be incorrect here, it should be called
     * 'element' since it is the DOM element, not the enabledElement object
     */
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

  /**
   * Loads display set if not loaded yet.
   */
  useEffect(() => {
    if (!displaySet.isLoaded) {
      displaySet.load();
    }
    setIsHydrated(displaySet.isHydrated);
  }, [displaySet]);

  /**
   * Update SR module tracking identifiers based on
   * currently active display set.
   *
   * @param {*} targetElement
   * @param {*} displaySet
   * @param {*} measurementSelected
   */
  const setTrackingUniqueIdentifiersForElement = (
    targetElement,
    displaySet,
    measurementSelected
  ) => {
    const { measurements } = displaySet;

    const srModule = cornerstoneTools.getModule(id);

    srModule.setters.trackingUniqueIdentifiersForElement(
      targetElement,
      measurements.map(measurement => measurement.TrackingUniqueIdentifier),
      measurementSelected
    );
  };

  /**
   * Updates measurements count.
   */
  useEffect(() => {
    const numMeasurements = displaySet.measurements.length;
    setMeasurementCount(numMeasurements);
  }, [dataSource, displaySet]);

  /**
   * Update SR viewport.
   *
   * @param {*} displaySet
   * @param {*} element
   * @param {*} dataSource
   * @param {*} newMeasurementSelected
   * @returns
   */
  const updateViewport = (
    displaySet,
    element,
    dataSource,
    newMeasurementSelected
  ) => {
    if (
      !displaySet.measurements ||
      !displaySet.measurements.filter(m => m.loaded === true).length > 0
    ) {
      return;
    }

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
      setTrackingUniqueIdentifiersForElement(
        element,
        displaySet,
        measurementSelected
      );
    }
  }, [dataSource, displaySet]);

  /**
   * Updates the SR viewport if data source,
   * element or display set changes.
   */
  useEffect(() => {
    updateViewport(displaySet, element, dataSource, measurementSelected);

    const onDisplaySetLoadedHandler = ({
      displaySet: { displaySetInstanceUID },
    }) => {
      if (displaySet.displaySetInstanceUID === displaySetInstanceUID) {
        updateViewport(displaySet, element, dataSource, measurementSelected);
      }
    };

    const subscription = DisplaySetService.subscribe(
      DisplaySetService.EVENTS.DISPLAY_SET_LOADED,
      onDisplaySetLoadedHandler
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [dataSource, displaySet, element]);

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

  if (![]) {
    return;
  }

  const {
    PatientID,
    PatientName,
    PatientSex,
    PatientAge,
    SliceThickness,
    ManufacturerModelName,
    StudyDate,
    SeriesDescription,
    SpacingBetweenSlices,
    SeriesNumber,
  } = activeDisplaySetData;

  /**
   * Measurement change event handler.
   *
   * @param {*} direction
   */
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

    updateViewport(displaySet, element, dataSource, measurementSelected);
  };

  const label = viewports.length > 1 ? _viewportLabels[viewportIndex] : '';

  // TODO -> disabled double click for now: onDoubleClick={_onDoubleClick}
  return (
    <>
      {activeDisplaySetData && Object.keys(activeDisplaySetData).length > 0 && (
        <ViewportActionBar
          onDoubleClick={evt => {
            evt.stopPropagation();
            evt.preventDefault();
          }}
          onPillClick={() => {
            sendTrackedMeasurementsEvent('RESTORE_PROMPT_HYDRATE_SR', {
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
              thickness: SliceThickness
                ? `${Number(SliceThickness).toFixed(2)}mm`
                : '',
              spacing:
                SpacingBetweenSlices !== undefined
                  ? `${SpacingBetweenSlices.toFixed(2)}mm`
                  : '',
              scanner: ManufacturerModelName || '',
            },
          }}
        />
      )}

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

  const { measurements: _measurements } = displaySet;
  const measurements = _measurements.filter(m => m.loaded === true);
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
