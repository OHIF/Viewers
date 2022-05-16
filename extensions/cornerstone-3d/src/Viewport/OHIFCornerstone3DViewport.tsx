import React, { useEffect, useRef, useCallback, useState } from 'react';
import ReactResizeDetector from 'react-resize-detector';
import { useViewportGrid, ImageScrollbar } from '@ohif/ui';
import * as cs3DTools from '@cornerstonejs/tools';
import { Enums, eventTarget } from '@cornerstonejs/core';

import PropTypes from 'prop-types';

import { setEnabledElement } from '../state';
import Cornerstone3DViewportService from '../services/ViewportService/Cornerstone3DViewportService';
import Cornerstone3DCacheService from '../services/CacheService/Cornerstone3DCacheService';
import CornerstoneOverlay from './CornerstoneOverlay';
import ViewportLoadingIndicator from './ViewportLoadingIndicator';
import ViewportOrientationMarkers from './ViewportOrientationMarkers';

import './OHIFCornerstone3DViewport.css';

const STACK = 'stack';

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
    const areSameDisplaySetInstanceUIDs =
      prevDisplaySets.displaySetInstanceUID ===
      nextDisplaySets.displaySetInstanceUID;
    const areSameImageLength =
      prevDisplaySets.images.length === nextDisplaySets.images.length;
    const areSameImageIds = prevDisplaySets.images.every(
      (prevImage, index) =>
        prevImage.imageId === nextDisplaySets.images[index].imageId
    );
    return (
      areSameDisplaySetInstanceUIDs && areSameImageLength && areSameImageIds
    );
  }
  return false;
}

// Todo: This should be done with expose of internal API similar to react-vtkjs-viewport
// Then we don't need to worry about the re-renders if the props change.
const OHIFCornerstoneViewport = React.memo(props => {
  const {
    viewportIndex,
    displaySets,
    dataSource,
    viewportOptions,
    displaySetOptions,
    servicesManager,
    onElementEnabled,
    // Note: you SHOULD NOT use the initialImageIdOrIndex for manipulation
    // of the imageData in the OHIFCornerstone3DViewport. This prop is used
    // to set the initial state of the viewport's first image to render
    initialImageIdOrIndex,
  } = props;

  const [viewportData, setViewportData] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [scrollbarHeight, setScrollbarHeight] = useState('100px');
  const [_, viewportGridService] = useViewportGrid();

  const elementRef = useRef();

  const {
    MeasurementService,
    DisplaySetService,
    ToolBarService,
    ToolGroupService,
  } = servicesManager.services;

  // useCallback for scroll bar height calculation
  const setImageScrollBarHeight = useCallback(() => {
    const scrollbarHeight = `${elementRef.current.clientHeight - 20}px`;
    setScrollbarHeight(scrollbarHeight);
  }, [elementRef]);

  // useCallback for onResize
  const onResize = useCallback(() => {
    if (elementRef.current) {
      Cornerstone3DViewportService.resize();
      setImageScrollBarHeight();
    }
  }, [elementRef]);

  const elementEnabledHandler = useCallback(
    evt => {
      // check this is this element reference and return early if doesn't match
      if (evt.detail.element !== elementRef.current) {
        return;
      }

      const { viewportId, element } = evt.detail;
      const viewportInfo = Cornerstone3DViewportService.getViewportInfoById(
        viewportId
      );
      const viewportIndex = viewportInfo.getViewportIndex();

      setEnabledElement(viewportIndex, element);

      const renderingEngineId = viewportInfo.getRenderingEngineId();
      const toolGroupId = viewportInfo.getToolGroupId();
      ToolGroupService.addToolGroupViewport(
        viewportId,
        renderingEngineId,
        toolGroupId
      );

      if (onElementEnabled) {
        onElementEnabled(evt);
      }
    },
    [viewportIndex, onElementEnabled, ToolGroupService]
  );

  // disable the element upon unmounting
  useEffect(() => {
    Cornerstone3DViewportService.enableElement(
      viewportIndex,
      elementRef.current
    );

    eventTarget.addEventListener(
      Enums.Events.ELEMENT_ENABLED,
      elementEnabledHandler
    );

    setImageScrollBarHeight();
    return () => {
      Cornerstone3DViewportService.disableElement(viewportIndex);
      eventTarget.removeEventListener(
        Enums.Events.ELEMENT_ENABLED,
        elementEnabledHandler
      );
    };
  }, []);

  useEffect(() => {
    // handle the default viewportType to be stack
    if (!viewportOptions.viewportType) {
      viewportOptions.viewportType = STACK;
    }

    const viewportData = Cornerstone3DCacheService.getViewportData(
      dataSource,
      displaySets,
      viewportOptions.viewportType,
      initialImageIdOrIndex
    );

    setViewportData(viewportData);

    Cornerstone3DViewportService.setViewportDisplaySets(
      viewportIndex,
      viewportData,
      viewportOptions,
      displaySetOptions
    );

    const element = elementRef.current;

    const updateIndex = event => {
      const { imageId } = event.detail;
      // find the index of imageId in the imageIds
      const index = viewportData.stack?.imageIds.indexOf(imageId);

      if (index !== -1) {
        setImageIndex(index);
      }
    };

    element.addEventListener(Enums.Events.STACK_NEW_IMAGE, updateIndex);

    return () => {
      element.removeEventListener(Enums.Events.STACK_NEW_IMAGE, updateIndex);
    };
  }, [viewportOptions, displaySets, dataSource]);

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
    if (!viewportData) {
      return;
    }

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
  }, [displaySets, elementRef, viewportIndex, viewportData]);

  const onImageScrollbarChange = useCallback(
    (imageIndex, viewportIndex) => {
      const viewportInfo = Cornerstone3DViewportService.getViewportInfoByIndex(
        viewportIndex
      );

      const viewportId = viewportInfo.getViewportId();
      const viewport = Cornerstone3DViewportService.getCornerstone3DViewport(
        viewportId
      );

      // if getCurrentImageId is not a method on viewport
      if (!viewport.getCurrentImageId) {
        throw new Error('cannot use scrollbar for non-stack viewports');
      }

      // Later scrollThroughStack should return two values the current index
      // and the total number of indices (volume it is different)
      viewport.setImageIdIndex(imageIndex).then(() => {
        // Update scrollbar index
        const currentIndex = viewport.getCurrentImageIdIndex();
        setImageIndex(currentIndex);
      });
    },
    [viewportIndex, viewportData]
  );

  return (
    <div className="viewport-wrapper">
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
        className="cornerstone3D-viewport-element"
        style={{ height: '100%', width: '100%' }}
        onContextMenu={e => e.preventDefault()}
        onMouseDown={e => e.preventDefault()}
        ref={elementRef}
      ></div>
      <ImageScrollbar
        onChange={evt => onImageScrollbarChange(evt, viewportIndex)}
        max={viewportData ? viewportData.stack?.imageIds?.length - 1 : 0}
        height={scrollbarHeight}
        value={imageIndex}
      />
      <CornerstoneOverlay
        viewportData={viewportData}
        imageIndex={imageIndex}
        viewportIndex={viewportIndex}
        ToolBarService={ToolBarService}
      />
      {viewportData && (
        <>
          <ViewportLoadingIndicator
            viewportData={viewportData}
            element={elementRef.current}
          />
          <ViewportOrientationMarkers
            viewportData={viewportData}
            imageIndex={imageIndex}
            viewportIndex={viewportIndex}
          />
        </>
      )}
    </div>
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
    cs3DTools.utilities.jumpToSlice(targetElement, metadata);

    cs3DTools.annotation.selection.setAnnotationSelected(measurement.uid);
    // Jump to measurement consumed, remove.
    MeasurementService.removeJumpToMeasurement(viewportIndex);
  }
}

// Component displayName
OHIFCornerstoneViewport.displayName = 'OHIFCornerstoneViewport';

OHIFCornerstoneViewport.propTypes = {
  viewportIndex: PropTypes.number.isRequired,
  displaySets: PropTypes.array.isRequired,
  dataSource: PropTypes.object.isRequired,
  viewportOptions: PropTypes.object,
  displaySetOptions: PropTypes.arrayOf(PropTypes.object),
  servicesManager: PropTypes.object.isRequired,
  onElementEnabled: PropTypes.func,
  // Note: you SHOULD NOT use the initialImageIdOrIndex for manipulation
  // of the imageData in the OHIFCornerstone3DViewport. This prop is used
  // to set the initial state of the viewport's first image to render
  initialImageIdOrIndex: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
};

export default OHIFCornerstoneViewport;
