import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import CornerstoneViewport from 'react-cornerstone-viewport';
import OHIF, { utils } from '@ohif/core';
import {
  Notification,
  ViewportActionBar,
  useViewportGrid,
  useViewportDialog,
} from '@ohif/ui';
import { useTrackedMeasurements } from './../getContextModule';

import ViewportOverlay from './ViewportOverlay';
import ViewportLoadingIndicator from './ViewportLoadingIndicator';
import setCornerstoneMeasurementActive from '../_shared/setCornerstoneMeasurementActive';

const scrollToIndex = cornerstoneTools.importInternal('util/scrollToIndex');
const { formatDate } = utils;

// TODO -> Get this list from the list of tracked measurements.
// TODO -> We can now get a list of tool names from the measurement service.
// Use the toolnames to check which tools we have instead, using the
// Classes isn't really extensible unless we add the classes to the measurement
// Service definition, which feels wrong.
const {
  ArrowAnnotateTool,
  BidirectionalTool,
  EllipticalRoiTool,
  LengthTool,
} = cornerstoneTools;

const BaseAnnotationTool = cornerstoneTools.importInternal(
  'base/BaseAnnotationTool'
);

const { StackManager } = OHIF.utils;

function TrackedCornerstoneViewport({
  children,
  dataSource,
  displaySet,
  viewportIndex,
  servicesManager,
  commandsManager
}) {
  const {
    ToolBarService,
    DisplaySetService,
    MeasurementService,
  } = servicesManager.services;
  const [trackedMeasurements] = useTrackedMeasurements();
  const [{ activeViewportIndex, viewports, isCineEnabled }, viewportGridService] = useViewportGrid();
  // viewportIndex, onSubmit
  const [viewportDialogState, viewportDialogApi] = useViewportDialog();
  const [viewportData, setViewportData] = useState(null);
  const [element, setElement] = useState(null);
  const [isTracked, setIsTracked] = useState(false);
  const [trackedMeasurementId, setTrackedMeasurementId] = useState(null);

  // TODO: Still needed? Better way than import `OHIF` and destructure?
  // Why is this managed by `core`?
  useEffect(() => {
    return () => {
      StackManager.clearStacks();
    };
  }, []);

  useEffect(() => {
    const unsubcribeFromJumpToMeasurementEvents = _subscribeToJumpToMeasurementEvents(
      MeasurementService,
      DisplaySetService,
      element,
      viewportIndex,
      displaySet.displaySetInstanceUID
    );

    _checkForCachedJumpToMeasurementEvents(
      MeasurementService,
      DisplaySetService,
      element,
      viewportIndex,
      displaySet.displaySetInstanceUID
    );

    return () => {
      unsubcribeFromJumpToMeasurementEvents();
    };
  }, [element, displaySet]);

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

    const OHIFCornerstoneEnabledElementEvent = new CustomEvent(
      'ohif-cornerstone-enabled-element-event',
      {
        detail: {
          enabledElement: targetElement,
          viewportIndex,
        },
      }
    );

    document.dispatchEvent(OHIFCornerstoneEnabledElementEvent);
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

    _getViewportData(dataSource, displaySet).then(setViewportData);
  }, [dataSource, displaySet, viewports, viewportIndex]);

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
    PixelSpacing,
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

  const { cine } = viewports[viewportIndex];

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
          studyDate: formatDate(SeriesDate), // TODO: This is series date. Is that ok?
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
              PixelSpacing && PixelSpacing.length
                ? `${PixelSpacing[0].toFixed(2)}mm x ${PixelSpacing[1].toFixed(
                  2
                )}mm`
                : '',
            scanner: ManufacturerModelName || '',
          },
        }}
        showNavArrows={!isCineEnabled}
        showCine={isCineEnabled}
        cineProps={{
          isPlaying: cine.isPlaying,
          onClose: () => {
            commandsManager.runCommand('toggleCine');
            viewports.forEach((vp, index) => {
              viewportGridService.setCineForViewport({
                viewportIndex: index,
                cine: { ...cine, isPlaying: false },
              });
            });
          },
          onPlayPauseChange: isPlaying => {
            viewportGridService.setCineForViewport({
              viewportIndex: activeViewportIndex,
              cine: { ...cine, isPlaying },
            });
          },
          onFrameRateChange: frameRate => {
            viewportGridService.setCineForViewport({
              viewportIndex: activeViewportIndex,
              cine: { ...cine, frameRate },
            });
          },
        }}
      />
      {/* TODO: Viewport interface to accept stack or layers of content like this? */}
      <div className="relative flex flex-row w-full h-full overflow-hidden">
        <CornerstoneViewport
          onElementEnabled={onElementEnabled}
          viewportIndex={viewportIndex}
          imageIds={imageIds}
          imageIdIndex={currentImageIdIndex}
          // Sync resize throttle w/ sidepanel animation duration to prevent
          // seizure inducing strobe blinking effect
          resizeRefreshRateMs={150}
          // TODO: ViewportGrid Context?
          isActive={true} // todo
          isStackPrefetchEnabled={true} // todo
          isPlaying={cine.isPlaying}
          frameRate={cine.frameRate}
          isOverlayVisible={true}
          loadingIndicatorComponent={ViewportLoadingIndicator}
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
  // Get stack from Stack Manager
  const storedStack = StackManager.findOrCreateStack(displaySet, dataSource);

  // Clone the stack here so we don't mutate it
  const stack = Object.assign({}, storedStack);

  return stack;
}

// TODO -> disabled double click for now: onDoubleClick={_onDoubleClick}
function _onDoubleClick() {
  const cancelActiveManipulatorsForElement = cornerstoneTools.getModule(
    'manipulatorState'
  ).setters.cancelActiveManipulatorsForElement;
  const enabledElements = cornerstoneTools.store.state.enabledElements;
  enabledElements.forEach(element => {
    cancelActiveManipulatorsForElement(element);
  });
}

/**
 * Builds the viewport data from a datasource and a displayset.
 *
 * @param {Object} dataSource
 * @param {Object} displaySet
 * @return {Object} viewport data
 */

async function _getViewportData(dataSource, displaySet) {
  const stack = _getCornerstoneStack(displaySet, dataSource);

  const viewportData = {
    StudyInstanceUID: displaySet.StudyInstanceUID,
    displaySetInstanceUID: displaySet.displaySetInstanceUID,
    stack,
  };

  return viewportData;
}

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

function _subscribeToJumpToMeasurementEvents(
  MeasurementService,
  DisplaySetService,
  element,
  viewportIndex,
  displaySetInstanceUID
) {
  const { unsubscribe } = MeasurementService.subscribe(
    MeasurementService.EVENTS.JUMP_TO_MEASUREMENT,
    ({ viewportIndex: jumpToMeasurementViewportIndex, measurement }) => {
      // check if the correct viewport index.
      if (viewportIndex !== jumpToMeasurementViewportIndex) {
        // Event for a different viewport.
        return;
      }

      if (measurement.displaySetInstanceUID !== displaySetInstanceUID) {
        // Not for this displaySet.
        return;
      }

      _jumpToMeasurement(
        measurement,
        element,
        viewportIndex,
        MeasurementService,
        DisplaySetService
      );
    }
  );

  return unsubscribe;
}

function _checkForCachedJumpToMeasurementEvents(
  MeasurementService,
  DisplaySetService,
  element,
  viewportIndex,
  displaySetInstanceUID
) {
  // Check if there is a queued jumpToMeasurement event
  const measurementIdToJumpTo = MeasurementService.getJumpToMeasurement(
    viewportIndex
  );

  if (measurementIdToJumpTo && element) {
    // Jump to measurement if the measurement exists
    const measurement = MeasurementService.getMeasurement(
      measurementIdToJumpTo
    );

    if (measurement.displaySetInstanceUID === displaySetInstanceUID) {
      _jumpToMeasurement(
        measurement,
        element,
        viewportIndex,
        MeasurementService,
        DisplaySetService
      );
    }
  }
}

function _jumpToMeasurement(
  measurement,
  targetElement,
  viewportIndex,
  MeasurementService,
  DisplaySetService
) {
  const { displaySetInstanceUID, SOPInstanceUID } = measurement;

  const referencedDisplaySet = DisplaySetService.getDisplaySetByUID(
    displaySetInstanceUID
  );

  const imageIndex = referencedDisplaySet.images.findIndex(
    i => i.SOPInstanceUID === SOPInstanceUID
  );

  setCornerstoneMeasurementActive(measurement);

  if (targetElement !== null) {
    const enabledElement = cornerstone.getEnabledElement(targetElement);

    if (enabledElement.image) {
      // Wait for the image to update or we get a race condition when the element has only just been enabled.
      const scrollToHandler = evt => {
        scrollToIndex(targetElement, imageIndex);
        targetElement.removeEventListener(
          'cornerstoneimagerendered',
          scrollToHandler
        );
      };
      targetElement.addEventListener(
        'cornerstoneimagerendered',
        scrollToHandler
      );
      cornerstone.updateImage(targetElement);
    }

    // Jump to measurement consumed, remove.
    MeasurementService.removeJumpToMeasurement(viewportIndex);
  }
}

export default TrackedCornerstoneViewport;
