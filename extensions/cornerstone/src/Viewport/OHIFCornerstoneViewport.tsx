import React, { useEffect, useRef, useCallback, useState } from 'react';
import ReactResizeDetector from 'react-resize-detector';
import PropTypes from 'prop-types';
import { useViewportGrid } from '@ohif/ui';
import * as cs3DTools from '@cornerstonejs/tools';
import { Enums, eventTarget, getEnabledElement } from '@cornerstonejs/core';

import { setEnabledElement } from '../state';
import CornerstoneCacheService from '../services/ViewportService/CornerstoneCacheService';

import './OHIFCornerstoneViewport.css';
import CornerstoneOverlays from './Overlays/CornerstoneOverlays';

const STACK = 'stack';

function areEqual(prevProps, nextProps) {
  if (nextProps.needsRerendering) {
    return false;
  }

  if (prevProps.displaySets.length !== nextProps.displaySets.length) {
    return false;
  }

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
    onElementDisabled,
    // Note: you SHOULD NOT use the initialImageIdOrIndex for manipulation
    // of the imageData in the OHIFCornerstoneViewport. This prop is used
    // to set the initial state of the viewport's first image to render
    initialImageIndex,
  } = props;

  console.log('onElementDisabled=', onElementDisabled);

  const [scrollbarHeight, setScrollbarHeight] = useState('100px');
  const [viewportData, setViewportData] = useState(null);
  const [_, viewportGridService] = useViewportGrid();

  const elementRef = useRef();

  const {
    MeasurementService,
    DisplaySetService,
    ToolBarService,
    ToolGroupService,
    SyncGroupService,
    CornerstoneViewportService,
  } = servicesManager.services;

  // useCallback for scroll bar height calculation
  const setImageScrollBarHeight = useCallback(() => {
    const scrollbarHeight = `${elementRef.current.clientHeight - 20}px`;
    setScrollbarHeight(scrollbarHeight);
  }, [elementRef]);

  // useCallback for onResize
  const onResize = useCallback(() => {
    if (elementRef.current) {
      CornerstoneViewportService.resize();
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
      const viewportInfo = CornerstoneViewportService.getViewportInfo(
        viewportId
      );
      const viewportIndex = viewportInfo.getViewportIndex();

      setEnabledElement(viewportIndex, element);

      const renderingEngineId = viewportInfo.getRenderingEngineId();
      const toolGroupId = viewportInfo.getToolGroupId();
      const syncGroups = viewportInfo.getSyncGroups();

      ToolGroupService.addViewportToToolGroup(
        viewportId,
        renderingEngineId,
        toolGroupId
      );

      SyncGroupService.addViewportToSyncGroup(
        viewportId,
        renderingEngineId,
        syncGroups
      );

      if (onElementEnabled) {
        onElementEnabled(evt);
      }
    },
    [viewportIndex, onElementEnabled, ToolGroupService]
  );

  // disable the element upon unmounting
  useEffect(() => {
    CornerstoneViewportService.enableElement(
      viewportIndex,
      viewportOptions,
      elementRef.current
    );

    eventTarget.addEventListener(
      Enums.Events.ELEMENT_ENABLED,
      elementEnabledHandler
    );

    setImageScrollBarHeight();

    return () => {
      const viewportInfo = CornerstoneViewportService.getViewportInfoByIndex(
        viewportIndex
      );

      const viewportId = viewportInfo.getViewportId();
      const renderingEngineId = viewportInfo.getRenderingEngineId();
      const syncGroups = viewportInfo.getSyncGroups();

      ToolGroupService.disable(viewportId, renderingEngineId);
      SyncGroupService.removeViewportFromSyncGroup(
        viewportId,
        renderingEngineId,
        syncGroups
      );

      CornerstoneViewportService.disableElement(viewportIndex);

      eventTarget.removeEventListener(
        Enums.Events.ELEMENT_ENABLED,
        elementEnabledHandler
      );

      if (onElementDisabled) {
        onElementDisabled();
      }
    };
  }, []);

  // subscribe to displaySet metadata invalidation (updates)
  // Currently, if the metadata changes we need to re-render the display set
  // for it to take effect in the viewport. As we deal with scaling in the loading,
  // we need to remove the old volume from the cache, and let the
  // viewport to re-add it which will use the new metadata. Otherwise, the
  // viewport will use the cached volume and the new metadata will not be used.
  // Note: this approach does not actually end of sending network requests
  // and it uses the network cache
  useEffect(() => {
    const { unsubscribe } = DisplaySetService.subscribe(
      DisplaySetService.EVENTS.DISPLAY_SET_SERIES_METADATA_INVALIDATED,
      async invalidatedDisplaySetInstanceUID => {
        if (
          viewportData.displaySetInstanceUIDs.includes(
            invalidatedDisplaySetInstanceUID
          )
        ) {
          const newViewportData = await CornerstoneCacheService.invalidateViewportData(
            viewportData,
            invalidatedDisplaySetInstanceUID,
            dataSource,
            DisplaySetService
          );

          CornerstoneViewportService.updateViewport(
            viewportIndex,
            newViewportData
          );

          setViewportData(newViewportData);
        }
      }
    );
    return () => {
      unsubscribe();
    };
  }, [viewportData, viewportIndex]);

  useEffect(() => {
    // handle the default viewportType to be stack
    if (!viewportOptions.viewportType) {
      viewportOptions.viewportType = STACK;
    }

    const loadViewportData = async () => {
      const viewportData = await CornerstoneCacheService.getViewportData(
        viewportIndex,
        displaySets,
        viewportOptions.viewportType,
        dataSource,
        initialImageIndex
      );

      CornerstoneViewportService.setViewportDisplaySets(
        viewportIndex,
        viewportData,
        viewportOptions,
        displaySetOptions
      );

      setViewportData(viewportData);
    };

    loadViewportData();
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
        className="cornerstone-viewport-element"
        style={{ height: '100%', width: '100%' }}
        onContextMenu={e => e.preventDefault()}
        onMouseDown={e => e.preventDefault()}
        ref={elementRef}
      ></div>
      <CornerstoneOverlays
        viewportIndex={viewportIndex}
        ToolBarService={ToolBarService}
        element={elementRef.current}
        scrollbarHeight={scrollbarHeight}
        servicesManager={servicesManager}
      />
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

  if (getEnabledElement(targetElement)) {
    cs3DTools.utilities.jumpToSlice(targetElement, {
      imageIndex: imageIdIndex,
    });

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
  // of the imageData in the OHIFCornerstoneViewport. This prop is used
  // to set the initial state of the viewport's first image to render
  initialImageIdOrIndex: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
};

export default OHIFCornerstoneViewport;
