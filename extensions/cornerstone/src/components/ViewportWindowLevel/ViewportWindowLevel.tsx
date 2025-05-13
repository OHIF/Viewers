import React, { useEffect, useCallback, useState, ReactElement, useMemo } from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';
import { PanelSection, WindowLevel } from '@ohif/ui-next';
import { BaseVolumeViewport, Enums, eventTarget } from '@cornerstonejs/core';
import { useActiveViewportDisplaySets } from '@ohif/core';
import {
  getNodeOpacity,
  isPetVolumeWithDefaultOpacity,
  isVolumeWithConstantOpacity,
  getWindowLevelsData,
} from './utils';

const { Events } = Enums;

const ViewportWindowLevel = ({
  servicesManager,
  viewportId,
}: withAppTypes<{
  viewportId: string;
}>): ReactElement => {
  const { cornerstoneViewportService } = servicesManager.services;
  const [windowLevels, setWindowLevels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const displaySets = useActiveViewportDisplaySets();

  const getViewportsWithVolumeIds = useCallback(
    (volumeIds: string[]) => {
      const renderingEngine = cornerstoneViewportService.getRenderingEngine();
      const viewports = renderingEngine.getVolumeViewports();

      return viewports.filter(vp => {
        const viewportVolumeIds = vp instanceof BaseVolumeViewport ? vp.getAllVolumeIds() : [];
        return (
          volumeIds.length === viewportVolumeIds.length &&
          volumeIds.every(volumeId => viewportVolumeIds.includes(volumeId))
        );
      });
    },
    [cornerstoneViewportService]
  );

  const getVolumeOpacity = useCallback((viewport, volumeId) => {
    const volumeActor = viewport.getActors().find(actor => actor.referencedId === volumeId)?.actor;

    if (isPetVolumeWithDefaultOpacity(volumeId, volumeActor)) {
      return getNodeOpacity(volumeActor, 1);
    } else if (isVolumeWithConstantOpacity(volumeActor)) {
      return getNodeOpacity(volumeActor, 0);
    }

    return undefined;
  }, []);

  const updateViewportHistograms = useCallback(() => {
    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
    const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportId);

    getWindowLevelsData(viewport, viewportInfo, getVolumeOpacity).then(data => {
      setWindowLevels(data);
    });
  }, [viewportId, cornerstoneViewportService, getVolumeOpacity]);

  const handleCornerstoneVOIModified = useCallback(
    e => {
      const { detail } = e;
      const { volumeId, range } = detail;
      const oldWindowLevel = windowLevels.find(wl => wl.volumeId === volumeId);

      if (!oldWindowLevel) {
        return;
      }

      const oldVOI = oldWindowLevel.voi;
      const windowWidth = range.upper - range.lower;
      const windowCenter = range.lower + windowWidth / 2;

      if (windowWidth === oldVOI.windowWidth && windowCenter === oldVOI.windowCenter) {
        return;
      }

      const newWindowLevel = {
        ...oldWindowLevel,
        voi: {
          windowWidth,
          windowCenter,
        },
      };

      setWindowLevels(
        windowLevels.map(windowLevel =>
          windowLevel === oldWindowLevel ? newWindowLevel : windowLevel
        )
      );
    },
    [windowLevels]
  );

  const debouncedHandleCornerstoneVOIModified = useMemo(
    () => debounce(handleCornerstoneVOIModified, 100),
    [handleCornerstoneVOIModified]
  );

  const handleVOIChange = useCallback(
    (volumeId, voi) => {
      const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

      const newRange = {
        lower: voi.windowCenter - voi.windowWidth / 2,
        upper: voi.windowCenter + voi.windowWidth / 2,
      };

      viewport.setProperties({ voiRange: newRange }, volumeId);
      viewport.render();
    },
    [cornerstoneViewportService, viewportId]
  );

  const handleOpacityChange = useCallback(
    (viewportId, _volumeIndex, volumeId, opacity) => {
      const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

      if (!viewport) {
        return;
      }

      const viewportVolumeIds =
        viewport instanceof BaseVolumeViewport ? viewport.getAllVolumeIds() : [];
      const viewports = getViewportsWithVolumeIds(viewportVolumeIds);

      viewports.forEach(vp => {
        vp.setProperties({ colormap: { opacity } }, volumeId);
        vp.render();
      });
    },
    [getViewportsWithVolumeIds, cornerstoneViewportService]
  );

  // New function to handle image volume loading completion
  const handleImageVolumeLoadingCompleted = useCallback(() => {
    setIsLoading(false);
    updateViewportHistograms();
  }, [updateViewportHistograms]);

  // Listen to cornerstone events and set up interval for histogram updates
  useEffect(() => {
    document.addEventListener(Events.VOI_MODIFIED, debouncedHandleCornerstoneVOIModified, true);
    eventTarget.addEventListener(
      Events.IMAGE_VOLUME_LOADING_COMPLETED,
      handleImageVolumeLoadingCompleted
    );

    const intervalId = setInterval(() => {
      if (isLoading) {
        updateViewportHistograms();
      }
    }, 1000);

    return () => {
      document.removeEventListener(
        Events.VOI_MODIFIED,
        debouncedHandleCornerstoneVOIModified,
        true
      );
      eventTarget.removeEventListener(
        Events.IMAGE_VOLUME_LOADING_COMPLETED,
        handleImageVolumeLoadingCompleted
      );
      clearInterval(intervalId);
    };
  }, [
    updateViewportHistograms,
    debouncedHandleCornerstoneVOIModified,
    handleImageVolumeLoadingCompleted,
    isLoading,
  ]);

  // Create a memoized version of displaySet IDs for comparison
  const displaySetIds = useMemo(() => {
    return displaySets?.map(ds => ds.displaySetInstanceUID).sort() || [];
  }, [displaySets]);

  useEffect(() => {
    const { unsubscribe } = cornerstoneViewportService.subscribe(
      cornerstoneViewportService.EVENTS.VIEWPORT_VOLUMES_CHANGED,
      ({ viewportInfo }) => {
        if (viewportInfo.viewportId === viewportId) {
          updateViewportHistograms();
        }
      }
    );

    // Only update if displaySets actually changed and are loaded
    if (displaySetIds.length && !isLoading) {
      updateViewportHistograms();
    }

    return () => {
      unsubscribe();
    };
  }, [viewportId, cornerstoneViewportService, updateViewportHistograms, displaySetIds, isLoading]);

  return (
    <PanelSection defaultOpen={true}>
      <PanelSection.Header>Window Level</PanelSection.Header>
      <PanelSection.Content className="bg-muted py-1">
        {windowLevels.map((windowLevel, i) => {
          if (!windowLevel.histogram) {
            return null;
          }

          return (
            <WindowLevel
              key={windowLevel.volumeId}
              histogram={windowLevel.histogram}
              voi={windowLevel.voi}
              step={windowLevel.step}
              showOpacitySlider={windowLevel.showOpacitySlider}
              colormap={windowLevel.colormap}
              onVOIChange={voi => handleVOIChange(windowLevel.volumeId, voi)}
              opacity={windowLevel.opacity}
              onOpacityChange={opacity =>
                handleOpacityChange(windowLevel.viewportId, i, windowLevel.volumeId, opacity)
              }
            />
          );
        })}
        {windowLevels.length === 0 && !isLoading && (
          <div className="text-muted-foreground py-2 text-center text-sm">
            No window level data available
          </div>
        )}
      </PanelSection.Content>
    </PanelSection>
  );
};

ViewportWindowLevel.propTypes = {
  servicesManager: PropTypes.object.isRequired,
  viewportId: PropTypes.string.isRequired,
};

export default ViewportWindowLevel;
