import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as cs3DTools from '@cornerstonejs/tools';
import { Enums, eventTarget, getEnabledElement } from '@cornerstonejs/core';
import { MeasurementService, useViewportRef } from '@ohif/core';
import { useViewportDialog, useViewportGrid } from '@ohif/ui-next';
import type { Types as csTypes } from '@cornerstonejs/core';

import { setEnabledElement } from '../state';

import './OHIFCornerstoneViewport.css';
import CornerstoneOverlays from './Overlays/CornerstoneOverlays';
import CinePlayer from '../components/CinePlayer';

import OHIFViewportActionCorners from '../components/OHIFViewportActionCorners';
import { useSynchronizersStore } from '../stores/useSynchronizersStore';
import ActiveViewportBehavior from '../utils/ActiveViewportBehavior';
import { WITH_NAVIGATION } from '../services/ViewportService/CornerstoneViewportService';

// Cache for viewport dimensions, persists across component remounts
const viewportDimensions = new Map<string, { width: number; height: number }>();

const OHIFCornerstoneViewport = (
  props: withAppTypes<{
    viewportId: string;
    displaySets: AppTypes.DisplaySet[];
    viewportOptions: AppTypes.ViewportGrid.GridViewportOptions;
    initialImageIndex: number;
  }>
) => {
  const {
    displaySets,
    dataSource,
    viewportOptions,
    displaySetOptions,
    servicesManager,
    onElementEnabled,
    // eslint-disable-next-line react/prop-types
    onElementDisabled,
    isJumpToMeasurementDisabled = false,
    // Note: you SHOULD NOT use the initialImageIdOrIndex for manipulation
    // of the imageData in the OHIFCornerstoneViewport. This prop is used
    // to set the initial state of the viewport's first image to render
    // eslint-disable-next-line react/prop-types
    initialImageIndex,
    // if the viewport is part of a hanging protocol layout
    // we should not really rely on the old synchronizers and
    // you see below we only rehydrate the synchronizers if the viewport
    // is not part of the hanging protocol layout. HPs should
    // define their own synchronizers. Since the synchronizers are
    // viewportId dependent and
    // eslint-disable-next-line react/prop-types
    isHangingProtocolLayout,
  } = props;
  const viewportId = viewportOptions.viewportId;

  if (!viewportId) {
    throw new Error('Viewport ID is required');
  }

  const [scrollbarHeight, setScrollbarHeight] = useState('100px');
  const [enabledVPElement, setEnabledVPElement] = useState(null);
  const elementRef = useRef() as React.MutableRefObject<HTMLDivElement>;
  const viewportRef = useViewportRef(viewportId);

  // The grid composition revision joins the published mount intent so
  // explicit invalidations (eg segmentation hydration via bumpComposition)
  // trigger a remount without any needsRerendering prop poking.
  const compositionRevision = useViewportGrid(
    state => state.viewports.get(viewportId)?.compositionRevision ?? 0
  );

  const {
    toolbarService,
    toolGroupService,
    syncGroupService,
    cornerstoneViewportService,
    segmentationService,
    customizationService,
    measurementService,
  } = servicesManager.services;

  const [viewportDialogState] = useViewportDialog();
  // useCallback for scroll bar height calculation
  const setImageScrollBarHeight = useCallback(() => {
    const scrollbarHeight = `${elementRef.current.clientHeight - 10}px`;
    setScrollbarHeight(scrollbarHeight);
  }, [elementRef]);

  // useCallback for onResize
  const onResize = useCallback(
    (entries: ResizeObserverEntry[]) => {
      if (elementRef.current && entries?.length) {
        const entry = entries[0];
        const { width, height } = entry.contentRect;

        const prevDimensions = viewportDimensions.get(viewportId) || { width: 0, height: 0 };

        // Check if dimensions actually changed and then only resize if they have changed
        const hasDimensionsChanged =
          prevDimensions.width !== width || prevDimensions.height !== height;

        if (width > 0 && height > 0 && hasDimensionsChanged) {
          viewportDimensions.set(viewportId, { width, height });
          // Perform resize operations
          cornerstoneViewportService.resize();
          setImageScrollBarHeight();
        }
      }
    },
    [viewportId, elementRef, cornerstoneViewportService, setImageScrollBarHeight]
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(element);

    // Cleanup function
    return () => {
      resizeObserver.unobserve(element);
      resizeObserver.disconnect();
    };
  }, [onResize]);

  const cleanUpServices = useCallback(
    viewportInfo => {
      const renderingEngineId = viewportInfo.getRenderingEngineId();
      const syncGroups = viewportInfo.getSyncGroups();

      toolGroupService.removeViewportFromToolGroup(viewportId, renderingEngineId);
      syncGroupService.removeViewportFromSyncGroup(viewportId, renderingEngineId, syncGroups);

      segmentationService.clearSegmentationRepresentations(viewportId);
    },
    [viewportId, segmentationService, syncGroupService, toolGroupService]
  );

  const elementEnabledHandler = useCallback(
    evt => {
      // check this is this element reference and return early if doesn't match
      if (evt.detail.element !== elementRef.current) {
        return;
      }

      const { viewportId, element } = evt.detail;
      const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportId);

      if (!viewportInfo) {
        return;
      }

      setEnabledElement(viewportId, element);
      setEnabledVPElement(element);

      const renderingEngineId = viewportInfo.getRenderingEngineId();
      const toolGroupId = viewportInfo.getToolGroupId();
      const syncGroups = viewportInfo.getSyncGroups();

      toolGroupService.addViewportToToolGroup(viewportId, renderingEngineId, toolGroupId);

      syncGroupService.addViewportToSyncGroup(viewportId, renderingEngineId, syncGroups);

      // we don't need reactivity here so just use state
      const { synchronizersStore } = useSynchronizersStore.getState();
      if (synchronizersStore?.[viewportId]?.length && !isHangingProtocolLayout) {
        // If the viewport used to have a synchronizer, re apply it again
        _rehydrateSynchronizers(viewportId, syncGroupService);
      }

      if (onElementEnabled && typeof onElementEnabled === 'function') {
        onElementEnabled(evt);
      }
    },
    [viewportId, onElementEnabled, toolGroupService]
  );

  // disable the element upon unmounting
  useEffect(() => {
    cornerstoneViewportService.enableViewport(viewportId, elementRef.current);
    cornerstoneViewportService.attachViewportElement(viewportId, elementRef.current);

    eventTarget.addEventListener(Enums.Events.ELEMENT_ENABLED, elementEnabledHandler);

    setImageScrollBarHeight();

    return () => {
      // Detach before the teardown below: cancels any in-flight mount for
      // this element and forces a remount on a future re-attach.
      cornerstoneViewportService.detachViewportElement(viewportId);

      const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportId);

      if (!viewportInfo) {
        return;
      }

      cornerstoneViewportService.storePresentation({ viewportId });

      // This should be done after the store presentation since synchronizers
      // will get cleaned up and they need the viewportInfo to be present
      cleanUpServices(viewportInfo);

      if (onElementDisabled && typeof onElementDisabled === 'function') {
        onElementDisabled(viewportInfo);
      }

      cornerstoneViewportService.disableElement(viewportId);
      viewportRef.unregister();

      eventTarget.removeEventListener(Enums.Events.ELEMENT_ENABLED, elementEnabledHandler);
    };
  }, []);

  // Publish the mount intent on every render (no dependency array on
  // purpose): the mount controller's compareMountIntent comparator is the
  // render gate now, replacing the old React.memo areEqual comparator and the
  // needsRerendering escape hatches. The intent carries the RECEIVED props -
  // wrappers (SEG/SR/RT/PMAP/tracked) transform displaySets/viewportOptions
  // before rendering this component, so the raw grid composition must never
  // be used as the mount input.
  useEffect(() => {
    // One options object per display set, built as a copy so the prop array
    // (grid composition state) is not mutated from the render path.
    const paddedDisplaySetOptions = [...displaySetOptions];
    while (paddedDisplaySetOptions.length < displaySets.length) {
      paddedDisplaySetOptions.push({});
    }

    cornerstoneViewportService.setViewportMountIntent(viewportId, {
      displaySets,
      viewportOptions,
      displaySetOptions: paddedDisplaySetOptions,
      dataSource,
      initialImageIndex,
      compositionRevision,
    });
  });

  const Notification = customizationService.getCustomization('ui.notificationComponent');

  return (
    <React.Fragment>
      <div className="viewport-wrapper">
        <div
          className="cornerstone-viewport-element"
          style={{ height: '100%', width: '100%' }}
          onContextMenu={e => e.preventDefault()}
          onMouseDown={e => e.preventDefault()}
          data-viewportid={viewportId}
          ref={el => {
            elementRef.current = el;
            if (el) {
              viewportRef.register(el);
            }
          }}
        ></div>
        <CornerstoneOverlays
          viewportId={viewportId}
          toolBarService={toolbarService}
          element={elementRef.current}
          scrollbarHeight={scrollbarHeight}
          servicesManager={servicesManager}
        />
        <CinePlayer
          enabledVPElement={enabledVPElement}
          viewportId={viewportId}
          servicesManager={servicesManager}
        />
        <ActiveViewportBehavior
          viewportId={viewportId}
          servicesManager={servicesManager}
        />
      </div>
      {/* top offset of 24px to account for ViewportActionCorners. */}
      <div className="absolute top-[24px] w-full">
        {viewportDialogState.viewportId === viewportId && (
          <Notification
            id="viewport-notification"
            message={viewportDialogState.message}
            type={viewportDialogState.type}
            actions={viewportDialogState.actions}
            onSubmit={viewportDialogState.onSubmit}
            onOutsideClick={viewportDialogState.onOutsideClick}
            onKeyPress={viewportDialogState.onKeyPress}
          />
        )}
      </div>
      {/* The OHIFViewportActionCorners follows the viewport in the DOM so that it is naturally at a higher z-index.*/}
      <OHIFViewportActionCorners viewportId={viewportId} />
    </React.Fragment>
  );
};

function _rehydrateSynchronizers(viewportId: string, syncGroupService: any) {
  const { synchronizersStore } = useSynchronizersStore.getState();
  const synchronizers = synchronizersStore[viewportId];

  if (!synchronizers) {
    return;
  }

  synchronizers.forEach(synchronizerObj => {
    if (!synchronizerObj.id) {
      return;
    }

    const { id, sourceViewports, targetViewports } = synchronizerObj;

    const synchronizer = syncGroupService.getSynchronizer(id);

    if (!synchronizer) {
      return;
    }

    const sourceViewportInfo = sourceViewports.find(
      sourceViewport => sourceViewport.viewportId === viewportId
    );

    const targetViewportInfo = targetViewports.find(
      targetViewport => targetViewport.viewportId === viewportId
    );

    const isSourceViewportInSynchronizer = synchronizer
      .getSourceViewports()
      .find(sourceViewport => sourceViewport.viewportId === viewportId);

    const isTargetViewportInSynchronizer = synchronizer
      .getTargetViewports()
      .find(targetViewport => targetViewport.viewportId === viewportId);

    // if the viewport was previously a source viewport, add it again
    if (sourceViewportInfo && !isSourceViewportInSynchronizer) {
      synchronizer.addSource({
        viewportId: sourceViewportInfo.viewportId,
        renderingEngineId: sourceViewportInfo.renderingEngineId,
      });
    }

    // if the viewport was previously a target viewport, add it again
    if (targetViewportInfo && !isTargetViewportInSynchronizer) {
      synchronizer.addTarget({
        viewportId: targetViewportInfo.viewportId,
        renderingEngineId: targetViewportInfo.renderingEngineId,
      });
    }
  });
}

// Component displayName
OHIFCornerstoneViewport.displayName = 'OHIFCornerstoneViewport';

export default OHIFCornerstoneViewport;
