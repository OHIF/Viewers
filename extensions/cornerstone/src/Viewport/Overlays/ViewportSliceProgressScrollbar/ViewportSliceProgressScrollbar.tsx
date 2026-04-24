import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { VolumeViewport3D, utilities as csUtils } from '@cornerstonejs/core';
import {
  SmartScrollbar,
  SmartScrollbarTrack,
  SmartScrollbarFill,
  SmartScrollbarIndicator,
  SmartScrollbarEndpoints,
} from '@ohif/ui-next';
import { getViewportImageIds } from './helpers';
import {
  useLoadedSliceBytes,
  useProgressScrollbarMode,
  useViewedSliceBytes,
  useViewportSliceSync,
} from './hooks';
import { ViewportSliceProgressScrollbarProps } from './types';

function ViewportSliceProgressScrollbar({
  viewportData,
  viewportId,
  element,
  imageSliceData,
  setImageSliceData,
  servicesManager,
}: ViewportSliceProgressScrollbarProps) {
  const { cineService, cornerstoneViewportService, customizationService, viewedDataService } =
    servicesManager.services;

  const showLoadedEndpoints =
    customizationService.getCustomization('viewportScrollbar.showLoadedEndpoints') !== false;
  const showLoadedFill =
    customizationService.getCustomization('viewportScrollbar.showLoadedFill') !== false;
  const showViewedFill =
    customizationService.getCustomization('viewportScrollbar.showViewedFill') !== false;
  const showLoadingPattern =
    customizationService.getCustomization('viewportScrollbar.showLoadingPattern') !== false;
  const viewedDwellMsRaw = customizationService.getCustomization('viewportScrollbar.viewedDwellMs');
  const loadedBatchIntervalMsRaw = customizationService.getCustomization(
    'viewportScrollbar.loadedBatchIntervalMs'
  );
  const viewedDwellMs =
    typeof viewedDwellMsRaw === 'number' && viewedDwellMsRaw >= 0 ? viewedDwellMsRaw : 0;
  const loadedBatchIntervalMs =
    typeof loadedBatchIntervalMsRaw === 'number' && loadedBatchIntervalMsRaw >= 0
      ? loadedBatchIntervalMsRaw
      : 200;

  const { numberOfSlices, imageIndex } = imageSliceData;

  const imageIds = useMemo(() => getViewportImageIds(viewportData), [viewportData]);
  const imageIdToIndex = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < imageIds.length; i++) {
      const imageId = imageIds[i];
      if (imageId) {
        map.set(imageId, i);
      }
    }
    return map;
  }, [imageIds]);

  const isFullMode = useProgressScrollbarMode({
    viewportData,
    viewportId,
    element,
    cornerstoneViewportService,
  });

  useViewportSliceSync({
    viewportData,
    viewportId,
    element,
    cornerstoneViewportService,
    setImageSliceData,
  });

  const {
    bytes: loadedBytes,
    version: loadedVersion,
    isFull: isFullyLoaded,
  } = useLoadedSliceBytes({
    isFullMode,
    numberOfSlices,
    viewportData,
    imageIds,
    imageIdToIndex,
    loadedBatchIntervalMs,
  });

  const { bytes: viewedBytes, version: viewedVersion } = useViewedSliceBytes({
    isFullMode,
    numberOfSlices,
    imageIndex,
    imageIds,
    imageIdToIndex,
    viewedDwellMs,
    viewedDataService,
  });

  const onScrollbarValueChange = targetImageIndex => {
    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

    if (!viewport || viewport instanceof VolumeViewport3D) {
      return;
    }

    const { isCineEnabled } = cineService.getState();

    if (isCineEnabled) {
      cineService.stopClip(element, { viewportId });
      cineService.setCine({ id: viewportId, frameRate: undefined, isPlaying: false });
    }

    csUtils.jumpToSlice(viewport.element, {
      imageIndex: targetImageIndex,
      debounceLoading: true,
    });
  };

  const isLoading = isFullMode && showLoadingPattern ? !isFullyLoaded : false;

  if (!numberOfSlices || numberOfSlices <= 1) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        height: '100%',
        padding: '8px 5px',
        zIndex: 10,
      }}
    >
      <div
        style={{
          position: 'relative',
          height: '100%',
          width: '11px',
        }}
      >
        <SmartScrollbar
          className="absolute inset-0"
          value={imageIndex || 0}
          total={numberOfSlices}
          onValueChange={onScrollbarValueChange}
          isLoading={isLoading}
          enableKeyboardNavigation={false}
          aria-label="Image navigation scrollbar"
          indicator={
            customizationService.getCustomization('viewportScrollbar.indicator') as
              | Record<string, unknown>
              | undefined
          }
        >
          <SmartScrollbarTrack>
            {isFullMode && showLoadedFill && (
              <SmartScrollbarFill
                marked={loadedBytes}
                version={loadedVersion}
                className="bg-neutral/25"
                loadingClassName="bg-neutral/50"
              />
            )}
            {isFullMode && showViewedFill && (
              <SmartScrollbarFill
                marked={viewedBytes}
                version={viewedVersion}
                className="bg-primary/35"
                loadingClassName="bg-primary/35"
              />
            )}
          </SmartScrollbarTrack>
          <SmartScrollbarIndicator />
          {isFullMode && showLoadedEndpoints && (
            <SmartScrollbarEndpoints
              marked={loadedBytes}
              version={loadedVersion}
            />
          )}
        </SmartScrollbar>
      </div>
    </div>
  );
}

ViewportSliceProgressScrollbar.propTypes = {
  viewportData: PropTypes.object,
  viewportId: PropTypes.string.isRequired,
  element: PropTypes.instanceOf(Element),
  imageSliceData: PropTypes.object.isRequired,
  setImageSliceData: PropTypes.func.isRequired,
  servicesManager: PropTypes.object.isRequired,
};

export default ViewportSliceProgressScrollbar;
