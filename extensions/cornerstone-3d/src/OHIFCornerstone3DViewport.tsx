import React, { useEffect, useRef, useCallback } from 'react';
import { utilities } from '@cornerstonejs/tools';
import ReactResizeDetector from 'react-resize-detector';
import { useViewportGrid } from '@ohif/ui';

function areEqual(prevProps, nextProps) {
  if (nextProps.needsRerendering) {
    return false;
  }

  if (prevProps.displaySets.length !== nextProps.displaySets.length) {
    return false;
  }

  // Todo: handle fusion
  // Todo: handle orientation
  const prevDisplaySets = prevProps.displaySets[0];
  const nextDisplaySets = nextProps.displaySets[0];

  if (prevDisplaySets && nextDisplaySets) {
    return (
      prevDisplaySets.displaySetInstanceUID ===
        nextDisplaySets.displaySetInstanceUID &&
      prevDisplaySets.images.length === nextDisplaySets.images.length &&
      prevDisplaySets.images.every(
        (prevImage, index) =>
          prevImage.imageId === nextDisplaySets.images[index].imageId
      )
    );
  }
  return false;
}

// Todo: This should be done with expose of internal API similar to react-vtkjs-viewport
// Then we don't need to worry about the re-renders if the props change.
const OHIFCornerstoneViewport = React.memo(props => {
  const {
    displaySets,
    viewportIndex,
    dataSource,
    viewportOptions,
    displaySetOptions,
    servicesManager,
  } = props;

  const [_, viewportGridService] = useViewportGrid();

  const elementRef = useRef();
  const {
    ViewportService,
    MeasurementService,
    DisplaySetService,
  } = servicesManager.services;

  // useCallback for onResize
  const onResize = useCallback(
    props => {
      if (elementRef.current) {
        const element = elementRef.current;
        ViewportService.resize();
      }
    },
    [elementRef]
  );

  // disable the element upon unmounting
  useEffect(() => {
    // setElementRef(targetRef.current);
    ViewportService.enableElement(viewportIndex, elementRef.current);
    return () => {
      ViewportService.disableElement(viewportIndex);
    };
  }, []);

  // Todo: Use stackManager to handle the stack creation and imageId get, problem
  // would be what to do with the volumes which needs different schema for loading: streaming-wadors
  // Stack manager shouldn't care about the type of volume. Maybe add a postImageId creation callback?
  // Maybe we should need a volumeManager later on.
  useEffect(() => {
    ViewportService.setViewportDisplaySets(
      viewportIndex,
      displaySets,
      viewportOptions,
      displaySetOptions,
      dataSource
    );
  }, [
    viewportIndex,
    viewportOptions,
    displaySetOptions,
    displaySets,
    dataSource,
    ViewportService,
  ]);

  /**
   * There are two scenarios for jump to click
   * 1. Current viewports contain the displaySet that the annotation was drawn on
   * 2. Current viewports don't contain the displaySet that the annotation was drawn on
   * and we need to change the viewports displaySet for jumping.
   * Since measurement_jump happens via events and listeners, the former case is handled
   * by the measurement_jump direct callback, but the latter case is handled first by
   * the viewportGrid to set the correct displaySet on the viewport, AND THEN we check
   * the cache for jumping to see if there is any jump queued, then we jump to the correct slice.
   */
  useEffect(() => {
    const unsubscribeFromJumpToMeasurementEvents = _subscribeToJumpToMeasurementEvents(
      MeasurementService,
      DisplaySetService,
      elementRef,
      viewportIndex,
      displaySets,
      viewportGridService
    );

    _checkForCachedJumpToMeasurementEvents(
      MeasurementService,
      DisplaySetService,
      elementRef,
      viewportIndex,
      displaySets,
      viewportGridService
    );

    return () => {
      unsubscribeFromJumpToMeasurementEvents();
    };
  }, [
    displaySets,
    elementRef,
    viewportIndex,
    viewportGridService,
    MeasurementService,
    DisplaySetService,
  ]);

  return (
    <React.Fragment>
      <ReactResizeDetector
        handleWidth
        handleHeight
        skipOnMount={true} // Todo: make these configurable
        refreshMode={'debounce'}
        refreshRate={100}
        onResize={onResize}
        targetRef={elementRef.current}
      />
      <div
        className="viewport-element"
        style={{ height: '100%', width: '100%' }}
        onContextMenu={e => e.preventDefault()}
        onMouseDown={e => e.preventDefault()}
        ref={elementRef}
      ></div>
    </React.Fragment>
  );
}, areEqual);

function _subscribeToJumpToMeasurementEvents(
  MeasurementService,
  DisplaySetService,
  elementRef,
  viewportIndex,
  displaySets,
  viewportGridService
) {
  const displaysUIDs = displaySets.map(
    displaySet => displaySet.displaySetInstanceUID
  );
  const { unsubscribe } = MeasurementService.subscribe(
    MeasurementService.EVENTS.JUMP_TO_MEASUREMENT,
    ({ measurement }) => {
      if (!measurement) return;

      // Jump the the measurement if the viewport contains the displaySetUID (fusion)
      if (displaysUIDs.includes(measurement.displaySetInstanceUID)) {
        _jumpToMeasurement(
          measurement,
          elementRef,
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

// Check if there is a queued jumpToMeasurement event
function _checkForCachedJumpToMeasurementEvents(
  MeasurementService,
  DisplaySetService,
  elementRef,
  viewportIndex,
  displaySets,
  viewportGridService
) {
  const displaysUIDs = displaySets.map(
    displaySet => displaySet.displaySetInstanceUID
  );

  const measurementIdToJumpTo = MeasurementService.getJumpToMeasurement(
    viewportIndex
  );

  if (measurementIdToJumpTo && elementRef) {
    // Jump to measurement if the measurement exists
    const measurement = MeasurementService.getMeasurement(
      measurementIdToJumpTo
    );

    if (displaysUIDs.includes(measurement.displaySetInstanceUID)) {
      _jumpToMeasurement(
        measurement,
        elementRef,
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
  targetElementRef,
  viewportIndex,
  MeasurementService,
  DisplaySetService,
  viewportGridService
) {
  const targetElement = targetElementRef.current;
  const { displaySetInstanceUID, SOPInstanceUID } = measurement;

  if (!SOPInstanceUID) {
    console.warn('cannot jump in a non-acquisition plane measurements yet');
  }

  const referencedDisplaySet = DisplaySetService.getDisplaySetByUID(
    displaySetInstanceUID
  );

  const imageIdIndex = referencedDisplaySet.images.findIndex(
    i => i.SOPInstanceUID === SOPInstanceUID
  );

  // Todo: setCornerstoneMeasurementActive should be handled by the toolGroupManager
  //  to set it properly
  // setCornerstoneMeasurementActive(measurement);

  viewportGridService.setActiveViewportIndex(viewportIndex);

  if (targetElement !== null) {
    const metadata = {
      ...measurement.metadata,
      imageIdIndex,
    };
    utilities.jumpToSlice(targetElement, metadata);

    // Jump to measurement consumed, remove.
    MeasurementService.removeJumpToMeasurement(viewportIndex);
  }
}

// Component displayName
OHIFCornerstoneViewport.displayName = 'OHIFCornerstoneViewport';

export default OHIFCornerstoneViewport;
