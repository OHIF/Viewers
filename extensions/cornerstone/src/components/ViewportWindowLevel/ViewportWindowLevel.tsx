import React, { useEffect, useCallback, useState, ReactElement } from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';
import { ServicesManager } from '@ohif/core';
import { WindowLevel } from '@ohif/ui';
import vtkColorMaps from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction/ColorMaps';
import {
  Enums,
  eventTarget,
  cache as cs3DCache,
  utilities as csUtils,
} from '@cornerstonejs/core';

const { Events } = Enums;

const calcHistogram = (data, options) => {
  if (options === undefined) options = {};
  const histogram = {
    numBins: options.numBins || 256,
    range: { min: 0, max: 0 },
    bins: new Int32Array(1),
    maxBin: 0,
    maxBinValue: 0,
  };

  let minToUse = options.min;
  let maxToUse = options.max;

  if (minToUse === undefined || maxToUse === undefined) {
    let min = Infinity;
    let max = -Infinity;
    let index = data.length;

    while (index--) {
      const value = data[index];
      if (value < min) {
        min = value;
      }
      if (value > max) {
        max = value;
      }
    }

    minToUse = min;
    maxToUse = max;
  }

  histogram.range = { min: minToUse, max: maxToUse };

  const bins = new Int32Array(histogram.numBins);
  const binScale = histogram.numBins / (maxToUse - minToUse);

  for (let index = 0; index < data.length; index++) {
    const value = data[index];
    if (value < minToUse) continue;
    if (value > maxToUse) continue;
    const bin = Math.floor((value - minToUse) * binScale);
    bins[bin] += 1;
  }

  histogram.bins = bins;
  histogram.maxBin = 0;
  histogram.maxBinValue = 0;

  for (let bin = 0; bin < histogram.numBins; bin++) {
    if (histogram.bins[bin] > histogram.maxBinValue) {
      histogram.maxBin = bin;
      histogram.maxBinValue = histogram.bins[bin];
    }
  }

  return histogram;
};

const ViewportWindowLevel = ({
  servicesManager,
  viewportIndex,
}: {
  servicesManager: ServicesManager;
  viewportIndex: number;
}): ReactElement => {
  const { cornerstoneViewportService } = servicesManager.services;
  const [windowLevels, setWindowLevels] = useState([]);

  const getViewportVolumeHistogram = useCallback(
    (viewport, volume, options?) => {
      if (!volume?.loadStatus.loaded) {
        return undefined;
      }

      const volumeImageData = viewport.getImageData(volume.volumeId);

      if (!volumeImageData) {
        return undefined;
      }

      const { scalarData, imageData } = volumeImageData;
      const range = imageData.computeHistogram(imageData.getBounds());
      const { minimum: min, maximum: max } = range;
      const calcHistOptions = {
        numBins: 256,
        min: Math.max(min, options?.min ?? min),
        max: Math.min(max, options?.max ?? max),
      };

      return calcHistogram(scalarData, calcHistOptions);
    },
    []
  );

  const getWindowLevelsData = useCallback(
    (viewportIndex, prevWindowLevels = []) => {
      const viewport = cornerstoneViewportService.getCornerstoneViewportByIndex(
        viewportIndex
      );

      if (!viewport) {
        return [];
      }

      const viewportInfo = cornerstoneViewportService.getViewportInfoByIndex(
        viewportIndex
      );

      const volumeIds = viewport.getActors().map(actor => actor.uid);
      const viewportProperties = viewport.getProperties();
      const { voiRange } = viewportProperties;
      const viewportVoi = voiRange
        ? {
            windowWidth: voiRange.upper - voiRange.lower,
            windowCenter:
              voiRange.lower + (voiRange.upper - voiRange.lower) / 2,
          }
        : undefined;

      const windowLevels = volumeIds
        .map((volumeId, volumeIndex) => {
          const prevWindowLevel = prevWindowLevels.find(
            prev => prev.volumeId === volumeId
          );

          if (prevWindowLevel) {
            return { ...prevWindowLevel };
          }

          const volume = cs3DCache.getVolume(volumeId);
          const { metadata, scaling } = volume;
          const modality = metadata.Modality;

          // TODO: find a proper way to fix the histogram
          const options = {
            min: modality === 'PT' ? 0.1 : -999,
            max: modality === 'PT' ? 5 : 1000,
          };

          const histogram = getViewportVolumeHistogram(
            viewport,
            volume,
            options
          );
          const {
            voi: displaySetVOI,
            colormap: displaySetColormap,
          } = viewportInfo.displaySetOptions[volumeIndex];
          let colormap;

          if (displaySetColormap) {
            colormap =
              csUtils.colormap.getColormap(displaySetColormap.name) ??
              vtkColorMaps.getPresetByName(displaySetColormap.name);
          }

          const voi = !volumeIndex
            ? viewportVoi ?? displaySetVOI
            : displaySetVOI;

          return {
            modality,
            volumeId,
            volumeIndex,
            voi,
            histogram,
            colormap,
            step: scaling?.PET ? 0.05 : 1,
          };
        })
        .filter(windowLevel => !!windowLevel.histogram);

      return windowLevels;
    },
    [cornerstoneViewportService, getViewportVolumeHistogram]
  );

  const updateViewportHistograms = useCallback(() => {
    setWindowLevels(prevWindowLevels =>
      getWindowLevelsData(viewportIndex, prevWindowLevels)
    );
  }, [viewportIndex, getWindowLevelsData]);

  const handleVOIModified = useCallback(
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

      if (
        windowWidth === oldVOI.windowWidth &&
        windowCenter === oldVOI.windowCenter
      ) {
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

  const debouncedHandleVOIModified = useCallback(
    debounce(handleVOIModified, 100),
    [handleVOIModified]
  );

  const handleVOIChange = useCallback(
    (volumeId, voi) => {
      const viewport = cornerstoneViewportService.getCornerstoneViewportByIndex(
        viewportIndex
      );

      const newRange = {
        lower: voi.windowCenter - voi.windowWidth / 2,
        upper: voi.windowCenter + voi.windowWidth / 2,
      };

      viewport.setProperties({ voiRange: newRange }, volumeId);
      viewport.render();
    },
    [cornerstoneViewportService, viewportIndex]
  );

  const handleOpacityChange = useCallback(
    (_volumeIndex, _volumeId, opacity) => {
      // const viewport = cornerstoneViewportService.getCornerstoneViewportByIndex(
      //   viewportIndex
      // );
      // const properties = viewport.getProperties(volumeId);

      console.warn(`TODO: update opacity: ${opacity}`);
    },
    []
  );

  useEffect(() => updateViewportHistograms(), [
    viewportIndex,
    updateViewportHistograms,
  ]);

  useEffect(() => {
    eventTarget.addEventListener(
      Events.IMAGE_VOLUME_LOADING_COMPLETED,
      updateViewportHistograms
    );

    document.addEventListener(
      Events.VOI_MODIFIED,
      debouncedHandleVOIModified,
      true
    );

    return () => {
      eventTarget.removeEventListener(
        Events.IMAGE_VOLUME_LOADING_COMPLETED,
        updateViewportHistograms
      );

      document.removeEventListener(
        Events.VOI_MODIFIED,
        debouncedHandleVOIModified,
        true
      );
    };
  }, [updateViewportHistograms, debouncedHandleVOIModified]);

  return (
    <>
      {windowLevels.map((windowLevel, i) => (
        <WindowLevel
          key={windowLevel.volumeId}
          title={`Winddow Level (${windowLevel.modality})`}
          histogram={windowLevel.histogram}
          voi={windowLevel.voi}
          step={windowLevel.step}
          showOpacitySlider={!!i}
          colormap={windowLevel.colormap}
          onVOIChange={voi => handleVOIChange(windowLevel.volumeId, voi)}
          onOpacityChange={opacity =>
            handleOpacityChange(i, windowLevel.volumeId, opacity)
          }
        />
      ))}
    </>
  );
};

ViewportWindowLevel.propTypes = {
  servicesManager: PropTypes.instanceOf(ServicesManager),
  viewportIndex: PropTypes.number.isRequired,
};

export default ViewportWindowLevel;
