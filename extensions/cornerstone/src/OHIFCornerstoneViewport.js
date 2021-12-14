import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import CornerstoneViewport from 'react-cornerstone-viewport';
import OHIF from '@ohif/core';
import { useCine, useViewportGrid } from '@ohif/ui';

import ViewportLoadingIndicator from './ViewportLoadingIndicator';
import setCornerstoneMeasurementActive from './_shared/setCornerstoneMeasurementActive';
import setActiveAndPassiveToolsForElement from './_shared/setActiveAndPassiveToolsForElement';
import getTools from './_shared/getTools';

import ViewportOverlay from './ViewportOverlay';

const scrollToIndex = cornerstoneTools.importInternal('util/scrollToIndex');

const BaseAnnotationTool = cornerstoneTools.importInternal(
  'base/BaseAnnotationTool'
);

const { StackManager } = OHIF.utils;

function OHIFCornerstoneViewport({
  children,
  dataSource,
  displaySet,
  onElementEnabled,
  element,
  viewportIndex,
  servicesManager,
  commandsManager,
}) {
  const {
    ToolBarService,
    DisplaySetService,
    MeasurementService,
    HangingProtocolService,
  } = servicesManager.services;
  const [viewportData, setViewportData] = useState(null);
  const [{ cines }, cineService] = useCine();
  const [{ viewports }, viewportGridService] = useViewportGrid();

  const isMounted = useRef(false);
  const stageChangedRef = useRef(false);

  const onNewImage = (element, callback) => {
    const handler = () => {
      element.removeEventListener(cornerstone.EVENTS.IMAGE_RENDERED, handler);
      callback(element, ToolBarService);
    };
    element.addEventListener(cornerstone.EVENTS.IMAGE_RENDERED, handler);
  };

  const defaultOnElementEnabled = evt => {
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
      if (tool instanceof BaseAnnotationTool) {
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
  };

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      StackManager.clearStacks();
    };
  }, []);

  useEffect(() => {
    const { unsubscribe } = HangingProtocolService.subscribe(
      HangingProtocolService.EVENTS.STAGE_CHANGE,
      () => {
        stageChangedRef.current = true;
      }
    );
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    cineService.setCine({ id: viewportIndex });
  }, [viewportIndex]);

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

    _getViewportData(dataSource, displaySet).then(data => {
      if (isMounted.current) setViewportData(data);
    });
  }, [dataSource, displaySet, viewportIndex]);

  useEffect(() => {
    const unsubscribeFromJumpToMeasurementEvents = _subscribeToJumpToMeasurementEvents(
      MeasurementService,
      DisplaySetService,
      element,
      viewportIndex,
      displaySet.displaySetInstanceUID,
      viewportGridService
    );

    _checkForCachedJumpToMeasurementEvents(
      MeasurementService,
      DisplaySetService,
      element,
      viewportIndex,
      displaySet.displaySetInstanceUID,
      viewportGridService
    );

    // reseting the HP stage changed flag
    if (element) {
      onNewImage(element, () => {
        stageChangedRef.current = false;
      });
    }

    // running HP-defined callbacks: invert, window level ...
    if (element && displaySet.renderedCallback) {
      onNewImage(element, displaySet.renderedCallback);
    }

    return () => {
      unsubscribeFromJumpToMeasurementEvents();
    };
  }, [element, displaySet]);

  let childrenWithProps = null;

  if (!viewportData) {
    return null;
  }

  const {
    imageIds,
    initialImageIdIndex,
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

  const cine = cines[viewportIndex];
  const isPlaying = (cine && cine.isPlaying) || false;
  const frameRate = (cine && cine.frameRate) || 24;

  return (
    <div className="relative flex flex-row w-full h-full overflow-hidden">
      <CornerstoneViewport
        onElementEnabled={
          onElementEnabled ? onElementEnabled : defaultOnElementEnabled
        }
        viewportIndex={viewportIndex}
        imageIds={imageIds}
        imageIdIndex={initialImageIdIndex}
        initialViewport={displaySet.initialViewport} // from hanging protocol
        stageChanged={stageChangedRef.current}
        // Sync resize throttle w/ sidepanel animation duration to prevent
        // seizure inducing strobe blinking effect
        resizeRefreshRateMs={150}
        // TODO: ViewportGrid Context?
        isActive={true} // todo
        isStackPrefetchEnabled={true} // todo
        isPlaying={isPlaying}
        frameRate={frameRate}
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
      {childrenWithProps}
    </div>
  );
}

OHIFCornerstoneViewport.propTypes = {
  displaySet: PropTypes.object,
  viewportIndex: PropTypes.number,
  dataSource: PropTypes.object,
  children: PropTypes.node,
  customProps: PropTypes.object,
  ToolBarService: PropTypes.object,
};

OHIFCornerstoneViewport.defaultProps = {
  customProps: {},
};

const _viewportLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

function _getCornerstoneStack(displaySet, dataSource) {
  // Get stack from Stack Manager
  const storedStack = StackManager.findOrCreateStack(displaySet, dataSource);

  // Clone the stack here so we don't mutate it
  const stack = Object.assign({}, storedStack);

  return stack;
}

async function _getViewportData(dataSource, displaySet) {
  const stack = _getCornerstoneStack(displaySet, dataSource);

  const viewportData = {
    StudyInstanceUID: displaySet.StudyInstanceUID,
    displaySetInstanceUID: displaySet.displaySetInstanceUID,
    stack,
  };

  return viewportData;
}

function _subscribeToJumpToMeasurementEvents(
  MeasurementService,
  DisplaySetService,
  element,
  viewportIndex,
  displaySetInstanceUID,
  viewportGridService
) {
  const { unsubscribe } = MeasurementService.subscribe(
    MeasurementService.EVENTS.JUMP_TO_MEASUREMENT,
    ({ measurement }) => {
      if (!measurement) return;
      // check if the correct viewport index.
      // if (viewportIndex !== jumpToMeasurementViewportIndex) {
      //   // Event for a different viewport.
      //   return;
      // }

      // Jump the the measurement if the displaySetInstanceUID matches
      if (measurement.displaySetInstanceUID === displaySetInstanceUID) {
        _jumpToMeasurement(
          measurement,
          element,
          viewportIndex,
          MeasurementService,
          DisplaySetService,
          viewportGridService
        );
      }
    }
  );

  return unsubscribe;
}

function _checkForCachedJumpToMeasurementEvents(
  MeasurementService,
  DisplaySetService,
  element,
  viewportIndex,
  displaySetInstanceUID,
  viewportGridService
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
        DisplaySetService,
        viewportGridService
      );
    }
  }
}

function _jumpToMeasurement(
  measurement,
  targetElement,
  viewportIndex,
  MeasurementService,
  DisplaySetService,
  viewportGridService
) {
  const { displaySetInstanceUID, SOPInstanceUID } = measurement;

  const referencedDisplaySet = DisplaySetService.getDisplaySetByUID(
    displaySetInstanceUID
  );

  const imageIndex = referencedDisplaySet.images.findIndex(
    i => i.SOPInstanceUID === SOPInstanceUID
  );

  setCornerstoneMeasurementActive(measurement);
  viewportGridService.setActiveViewportIndex(viewportIndex);
  if (targetElement !== null) {
    const enabledElement = cornerstone.getEnabledElement(targetElement);

    // Wait for the image to update or we get a race condition when the element has only just been enabled.
    const scrollToHandler = evt => {
      scrollToIndex(targetElement, imageIndex);
      targetElement.removeEventListener(
        'cornerstoneimagerendered',
        scrollToHandler
      );
    };
    targetElement.addEventListener('cornerstoneimagerendered', scrollToHandler);

    if (enabledElement.image) {
      cornerstone.updateImage(targetElement);
    }

    // Jump to measurement consumed, remove.
    MeasurementService.removeJumpToMeasurement(viewportIndex);
  }
}

export default OHIFCornerstoneViewport;
