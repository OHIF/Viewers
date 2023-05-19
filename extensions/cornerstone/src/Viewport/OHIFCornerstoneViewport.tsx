import React, { useEffect, useRef, useCallback, useState } from 'react';
import ReactResizeDetector from 'react-resize-detector';
import PropTypes from 'prop-types';
import * as cs3DTools from '@cornerstonejs/tools';
import {
  Enums,
  eventTarget,
  getEnabledElement,
  StackViewport,
  utilities as csUtils,
} from '@cornerstonejs/core';
import { MeasurementService } from '@ohif/core';
import {
  CinePlayer,
  useCine,
  useViewportGrid,
  Notification,
  useViewportDialog,
} from '@ohif/ui';
import {
  IStackViewport,
  IVolumeViewport,
} from '@cornerstonejs/core/dist/esm/types';

import { setEnabledElement } from '../state';

import './OHIFCornerstoneViewport.css';
import CornerstoneOverlays from './Overlays/CornerstoneOverlays';
import getSOPInstanceAttributes from '../utils/measurementServiceMappings/utils/getSOPInstanceAttributes';
import CornerstoneServices from '../types/CornerstoneServices';

const STACK = 'stack';

/**
 * Caches the jump to measurement operation, so that if display set is shown,
 * it can jump to the measurement.
 */
let cacheJumpToMeasurementEvent;

function areEqual(prevProps, nextProps) {
  if (nextProps.needsRerendering) {
    return false;
  }

  if (prevProps.displaySets.length !== nextProps.displaySets.length) {
    return false;
  }

  if (
    prevProps.viewportOptions.orientation !==
    nextProps.viewportOptions.orientation
  ) {
    return false;
  }

  if (
    prevProps.viewportOptions.toolGroupId !==
    nextProps.viewportOptions.toolGroupId
  ) {
    return false;
  }

  if (
    prevProps.viewportOptions.viewportType !==
    nextProps.viewportOptions.viewportType
  ) {
    return false;
  }

  const prevDisplaySets = prevProps.displaySets;
  const nextDisplaySets = nextProps.displaySets;

  if (prevDisplaySets.length !== nextDisplaySets.length) {
    return false;
  }

  for (let i = 0; i < prevDisplaySets.length; i++) {
    const prevDisplaySet = prevDisplaySets[i];

    const foundDisplaySet = nextDisplaySets.find(
      nextDisplaySet =>
        nextDisplaySet.displaySetInstanceUID ===
        prevDisplaySet.displaySetInstanceUID
    );

    if (!foundDisplaySet) {
      return false;
    }

    // check they contain the same image
    if (foundDisplaySet.images?.length !== prevDisplaySet.images?.length) {
      return false;
    }

    // check if their imageIds are the same
    if (foundDisplaySet.images?.length) {
      for (let j = 0; j < foundDisplaySet.images.length; j++) {
        if (
          foundDisplaySet.images[j].imageId !== prevDisplaySet.images[j].imageId
        ) {
          return false;
        }
      }
    }
  }

  return true;
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

  const [scrollbarHeight, setScrollbarHeight] = useState('100px');
  const [{ isCineEnabled, cines }, cineService] = useCine();
  const [{ activeViewportIndex }] = useViewportGrid();
  const [enabledVPElement, setEnabledVPElement] = useState(null);

  const elementRef = useRef();

  const {
    measurementService,
    displaySetService,
    toolbarService,
    toolGroupService,
    syncGroupService,
    cornerstoneViewportService,
    cornerstoneCacheService,
    viewportGridService,
    stateSyncService,
  } = servicesManager.services as CornerstoneServices;

  const [viewportDialogState] = useViewportDialog();

  const cineHandler = () => {
    if (!cines || !cines[viewportIndex] || !enabledVPElement) {
      return;
    }

    const cine = cines[viewportIndex];
    const isPlaying = cine.isPlaying || false;
    const frameRate = cine.frameRate || 24;

    const validFrameRate = Math.max(frameRate, 1);

    if (isPlaying) {
      cineService.playClip(enabledVPElement, {
        framesPerSecond: validFrameRate,
      });
    } else {
      cineService.stopClip(enabledVPElement);
    }
  };

  useEffect(() => {
    eventTarget.addEventListener(
      Enums.Events.STACK_VIEWPORT_NEW_STACK,
      cineHandler
    );

    return () => {
      cineService.setCine({ id: viewportIndex, isPlaying: false });
      eventTarget.removeEventListener(
        Enums.Events.STACK_VIEWPORT_NEW_STACK,
        cineHandler
      );
    };
  }, [enabledVPElement]);

  useEffect(() => {
    if (!cines || !cines[viewportIndex] || !enabledVPElement) {
      return;
    }

    cineHandler();

    return () => {
      if (enabledVPElement && cines?.[viewportIndex]?.isPlaying) {
        cineService.stopClip(enabledVPElement);
      }
    };
  }, [cines, viewportIndex, cineService, enabledVPElement, cineHandler]);

  const cine = cines[viewportIndex];
  const isPlaying = (cine && cine.isPlaying) || false;

  const handleCineClose = () => {
    toolbarService.recordInteraction({
      groupId: 'MoreTools',
      itemId: 'cine',
      interactionType: 'toggle',
      commands: [
        {
          commandName: 'toggleCine',
          commandOptions: {},
          context: 'CORNERSTONE',
        },
      ],
    });
  };

  // useCallback for scroll bar height calculation
  const setImageScrollBarHeight = useCallback(() => {
    const scrollbarHeight = `${elementRef.current.clientHeight - 20}px`;
    setScrollbarHeight(scrollbarHeight);
  }, [elementRef]);

  // useCallback for onResize
  const onResize = useCallback(() => {
    if (elementRef.current) {
      cornerstoneViewportService.resize();
      setImageScrollBarHeight();
    }
  }, [elementRef]);

  const storePresentation = () => {
    const currentPresentation = cornerstoneViewportService.getPresentation(
      viewportIndex
    );
    if (!currentPresentation || !currentPresentation.presentationIds) return;
    const {
      lutPresentationStore,
      positionPresentationStore,
    } = stateSyncService.getState();
    const { presentationIds } = currentPresentation;
    const { lutPresentationId, positionPresentationId } = presentationIds || {};
    const storeState = {};
    if (lutPresentationId) {
      storeState.lutPresentationStore = {
        ...lutPresentationStore,
        [lutPresentationId]: currentPresentation,
      };
    }
    if (positionPresentationId) {
      storeState.positionPresentationStore = {
        ...positionPresentationStore,
        [positionPresentationId]: currentPresentation,
      };
    }
    stateSyncService.store(storeState);
  };

  const cleanUpServices = useCallback(() => {
    const viewportInfo = cornerstoneViewportService.getViewportInfoByIndex(
      viewportIndex
    );

    if (!viewportInfo) {
      return;
    }

    const viewportId = viewportInfo.getViewportId();
    const renderingEngineId = viewportInfo.getRenderingEngineId();
    const syncGroups = viewportInfo.getSyncGroups();

    toolGroupService.removeViewportFromToolGroup(viewportId, renderingEngineId);

    syncGroupService.removeViewportFromSyncGroup(
      viewportId,
      renderingEngineId,
      syncGroups
    );
  }, [viewportIndex, viewportOptions.viewportId]);

  const elementEnabledHandler = useCallback(
    evt => {
      // check this is this element reference and return early if doesn't match
      if (evt.detail.element !== elementRef.current) {
        return;
      }

      const { viewportId, element } = evt.detail;
      const viewportInfo = cornerstoneViewportService.getViewportInfo(
        viewportId
      );
      const viewportIndex = viewportInfo.getViewportIndex();

      setEnabledElement(viewportIndex, element);
      setEnabledVPElement(element);

      const renderingEngineId = viewportInfo.getRenderingEngineId();
      const toolGroupId = viewportInfo.getToolGroupId();
      const syncGroups = viewportInfo.getSyncGroups();

      toolGroupService.addViewportToToolGroup(
        viewportId,
        renderingEngineId,
        toolGroupId
      );

      syncGroupService.addViewportToSyncGroup(
        viewportId,
        renderingEngineId,
        syncGroups
      );

      if (onElementEnabled) {
        onElementEnabled(evt);
      }
    },
    [viewportIndex, onElementEnabled, toolGroupService]
  );

  // disable the element upon unmounting
  useEffect(() => {
    cornerstoneViewportService.enableViewport(
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
      storePresentation();

      cleanUpServices();

      const viewportInfo = cornerstoneViewportService.getViewportInfoByIndex(
        viewportIndex
      );

      cornerstoneViewportService.disableElement(viewportIndex);

      if (onElementDisabled) {
        onElementDisabled(viewportInfo);
      }

      eventTarget.removeEventListener(
        Enums.Events.ELEMENT_ENABLED,
        elementEnabledHandler
      );
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
    const { unsubscribe } = displaySetService.subscribe(
      displaySetService.EVENTS.DISPLAY_SET_SERIES_METADATA_INVALIDATED,
      async invalidatedDisplaySetInstanceUID => {
        const viewportInfo = cornerstoneViewportService.getViewportInfoByIndex(
          viewportIndex
        );

        if (viewportInfo.hasDisplaySet(invalidatedDisplaySetInstanceUID)) {
          const viewportData = viewportInfo.getViewportData();
          const newViewportData = await cornerstoneCacheService.invalidateViewportData(
            viewportData,
            invalidatedDisplaySetInstanceUID,
            dataSource,
            displaySetService
          );

          const keepCamera = true;
          cornerstoneViewportService.updateViewport(
            viewportIndex,
            newViewportData,
            keepCamera
          );
        }
      }
    );
    return () => {
      unsubscribe();
    };
  }, [viewportIndex]);

  useEffect(() => {
    // handle the default viewportType to be stack
    if (!viewportOptions.viewportType) {
      viewportOptions.viewportType = STACK;
    }

    const loadViewportData = async () => {
      const viewportData = await cornerstoneCacheService.createViewportData(
        displaySets,
        viewportOptions,
        dataSource,
        initialImageIndex
      );

      // The presentation state will have been stored previously by closing
      // a viewport.  Otherwise, this viewport will be unchanged and the
      // presentation information will be directly carried over.
      const {
        lutPresentationStore,
        positionPresentationStore,
      } = stateSyncService.getState();
      const { presentationIds } = viewportOptions;
      const presentations = {
        positionPresentation:
          positionPresentationStore[presentationIds?.positionPresentationId],
        lutPresentation:
          lutPresentationStore[presentationIds?.lutPresentationId],
      };
      let measurement;
      if (cacheJumpToMeasurementEvent?.viewportIndex === viewportIndex) {
        measurement = cacheJumpToMeasurementEvent.measurement;
        // Delete the position presentation so that viewport navigates direct
        presentations.positionPresentation = null;
        cacheJumpToMeasurementEvent = null;
      }

      cornerstoneViewportService.setViewportData(
        viewportIndex,
        viewportData,
        viewportOptions,
        displaySetOptions,
        presentations
      );

      if (measurement) {
        cs3DTools.annotation.selection.setAnnotationSelected(measurement.uid);
      }
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
      measurementService,
      displaySetService,
      elementRef,
      viewportIndex,
      displaySets,
      viewportGridService,
      cornerstoneViewportService
    );

    _checkForCachedJumpToMeasurementEvents(
      measurementService,
      displaySetService,
      elementRef,
      viewportIndex,
      displaySets,
      viewportGridService,
      cornerstoneViewportService
    );

    return () => {
      unsubscribeFromJumpToMeasurementEvents();
    };
  }, [displaySets, elementRef, viewportIndex]);

  return (
    <React.Fragment>
      <div className="viewport-wrapper">
        <ReactResizeDetector
          handleWidth
          handleHeight
          skipOnMount={true} // Todo: make these configurable
          refreshMode={'debounce'}
          refreshRate={200} // transition amount in side panel
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
          toolBarService={toolbarService}
          element={elementRef.current}
          scrollbarHeight={scrollbarHeight}
          servicesManager={servicesManager}
        />
        {isCineEnabled && (
          <CinePlayer
            className="absolute left-1/2 -translate-x-1/2 bottom-3"
            isPlaying={isPlaying}
            onClose={handleCineClose}
            onPlayPauseChange={isPlaying =>
              cineService.setCine({
                id: activeViewportIndex,
                isPlaying,
              })
            }
            onFrameRateChange={frameRate =>
              cineService.setCine({
                id: activeViewportIndex,
                frameRate,
              })
            }
          />
        )}
      </div>
      <div className="absolute w-full">
        {viewportDialogState.viewportIndex === viewportIndex && (
          <Notification
            id="viewport-notification"
            message={viewportDialogState.message}
            type={viewportDialogState.type}
            actions={viewportDialogState.actions}
            onSubmit={viewportDialogState.onSubmit}
            onOutsideClick={viewportDialogState.onOutsideClick}
          />
        )}
      </div>
    </React.Fragment>
  );
}, areEqual);

function _subscribeToJumpToMeasurementEvents(
  measurementService,
  displaySetService,
  elementRef,
  viewportIndex,
  displaySets,
  viewportGridService,
  cornerstoneViewportService
) {
  const displaysUIDs = displaySets.map(
    displaySet => displaySet.displaySetInstanceUID
  );
  const { unsubscribe } = measurementService.subscribe(
    MeasurementService.EVENTS.JUMP_TO_MEASUREMENT_VIEWPORT,
    props => {
      cacheJumpToMeasurementEvent = props;
      const { viewportIndex: jumpIndex, measurement, isConsumed } = props;
      if (!measurement || isConsumed) return;
      if (cacheJumpToMeasurementEvent.cornerstoneViewport === undefined) {
        // Decide on which viewport should handle this
        cacheJumpToMeasurementEvent.cornerstoneViewport = cornerstoneViewportService.getViewportIndexToJump(
          jumpIndex,
          measurement.displaySetInstanceUID,
          { referencedImageId: measurement.referencedImageId }
        );
      }
      if (cacheJumpToMeasurementEvent.cornerstoneViewport !== viewportIndex) {
        return;
      }
      _jumpToMeasurement(
        measurement,
        elementRef,
        viewportIndex,
        measurementService,
        displaySetService,
        viewportGridService,
        cornerstoneViewportService
      );
    }
  );

  return unsubscribe;
}

// Check if there is a queued jumpToMeasurement event
function _checkForCachedJumpToMeasurementEvents(
  measurementService,
  displaySetService,
  elementRef,
  viewportIndex,
  displaySets,
  viewportGridService,
  cornerstoneViewportService
) {
  if (!cacheJumpToMeasurementEvent) return;
  if (cacheJumpToMeasurementEvent.isConsumed) {
    cacheJumpToMeasurementEvent = null;
    return;
  }
  const displaysUIDs = displaySets.map(
    displaySet => displaySet.displaySetInstanceUID
  );
  if (!displaysUIDs?.length) return;

  // Jump to measurement if the measurement exists
  const { measurement } = cacheJumpToMeasurementEvent;
  if (measurement && elementRef) {
    if (displaysUIDs.includes(measurement?.displaySetInstanceUID)) {
      _jumpToMeasurement(
        measurement,
        elementRef,
        viewportIndex,
        measurementService,
        displaySetService,
        viewportGridService,
        cornerstoneViewportService
      );
    }
  }
}

function _jumpToMeasurement(
  measurement,
  targetElementRef,
  viewportIndex,
  measurementService,
  displaySetService,
  viewportGridService,
  cornerstoneViewportService
) {
  const targetElement = targetElementRef.current;
  const { displaySetInstanceUID, SOPInstanceUID, frameNumber } = measurement;

  if (!SOPInstanceUID) {
    console.warn('cannot jump in a non-acquisition plane measurements yet');
    return;
  }

  const referencedDisplaySet = displaySetService.getDisplaySetByUID(
    displaySetInstanceUID
  );

  // Todo: setCornerstoneMeasurementActive should be handled by the toolGroupManager
  //  to set it properly
  // setCornerstoneMeasurementActive(measurement);

  viewportGridService.setActiveViewportIndex(viewportIndex);

  const enabledElement = getEnabledElement(targetElement);

  const viewportInfo = cornerstoneViewportService.getViewportInfoByIndex(
    viewportIndex
  );

  if (enabledElement) {
    // See how the jumpToSlice() of Cornerstone3D deals with imageIdx param.
    const viewport = enabledElement.viewport as
      | IStackViewport
      | IVolumeViewport;

    let imageIdIndex = 0;
    let viewportCameraDirectionMatch = true;

    if (viewport instanceof StackViewport) {
      const imageIds = viewport.getImageIds();
      imageIdIndex = imageIds.findIndex(imageId => {
        const {
          SOPInstanceUID: aSOPInstanceUID,
          frameNumber: aFrameNumber,
        } = getSOPInstanceAttributes(imageId);
        return (
          aSOPInstanceUID === SOPInstanceUID &&
          (!frameNumber || frameNumber === aFrameNumber)
        );
      });
    } else {
      // for volume viewport we can't rely on the imageIdIndex since it can be
      // a reconstructed view that doesn't match the original slice numbers etc.
      const { viewPlaneNormal: measurementViewPlane } = measurement.metadata;
      imageIdIndex = referencedDisplaySet.images.findIndex(
        i => i.SOPInstanceUID === SOPInstanceUID
      );

      const { viewPlaneNormal: viewportViewPlane } = viewport.getCamera();

      // should compare abs for both planes since the direction can be flipped
      if (
        measurementViewPlane &&
        !csUtils.isEqual(
          measurementViewPlane.map(Math.abs),
          viewportViewPlane.map(Math.abs)
        )
      ) {
        viewportCameraDirectionMatch = false;
      }
    }

    if (!viewportCameraDirectionMatch || imageIdIndex === -1) {
      return;
    }

    cs3DTools.utilities.jumpToSlice(targetElement, {
      imageIndex: imageIdIndex,
    });

    cs3DTools.annotation.selection.setAnnotationSelected(measurement.uid);
    // Jump to measurement consumed, remove.
    cacheJumpToMeasurementEvent?.consume?.();
    cacheJumpToMeasurementEvent = null;
  }
}

// Component displayName
OHIFCornerstoneViewport.displayName = 'OHIFCornerstoneViewport';

OHIFCornerstoneViewport.propTypes = {
  viewportIndex: PropTypes.number.isRequired,
  displaySets: PropTypes.array.isRequired,
  dataSource: PropTypes.object.isRequired,
  viewportOptions: PropTypes.object,
  displaySetOptions: PropTypes.arrayOf(PropTypes.any),
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
