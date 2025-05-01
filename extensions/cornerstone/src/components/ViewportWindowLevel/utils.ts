import { cache as cs3DCache, Types } from '@cornerstonejs/core';
import vtkColorMaps from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction/ColorMaps';
import { utilities as csUtils } from '@cornerstonejs/core';
import { getViewportVolumeHistogram } from './getViewportVolumeHistogram';

/**
 * Gets node opacity from volume actor
 */
export const getNodeOpacity = (volumeActor, nodeIndex) => {
  const volumeOpacity = volumeActor.getProperty().getScalarOpacity(0);
  const nodeValue = [];

  volumeOpacity.getNodeValue(nodeIndex, nodeValue);

  return nodeValue[1];
};

/**
 * Checks if the opacity applied to the PET volume follows a specific pattern
 */
export const isPetVolumeWithDefaultOpacity = (volumeId: string, volumeActor) => {
  const volume = cs3DCache.getVolume(volumeId);

  if (!volume || volume.metadata.Modality !== 'PT') {
    return false;
  }

  const volumeOpacity = volumeActor.getProperty().getScalarOpacity(0);

  if (volumeOpacity.getSize() < 2) {
    return false;
  }

  const node1Value = [];
  const node2Value = [];

  volumeOpacity.getNodeValue(0, node1Value);
  volumeOpacity.getNodeValue(1, node2Value);

  if (node1Value[0] !== 0 || node1Value[1] !== 0 || node2Value[0] !== 0.1) {
    return false;
  }

  const expectedOpacity = node2Value[1];
  const opacitySize = volumeOpacity.getSize();
  const currentNodeValue = [];

  for (let i = 2; i < opacitySize; i++) {
    volumeOpacity.getNodeValue(i, currentNodeValue);
    if (currentNodeValue[1] !== expectedOpacity) {
      return false;
    }
  }

  return true;
};

/**
 * Checks if volume has constant opacity
 */
export const isVolumeWithConstantOpacity = volumeActor => {
  const volumeOpacity = volumeActor.getProperty().getScalarOpacity(0);
  const opacitySize = volumeOpacity.getSize();
  const firstNodeValue = [];

  volumeOpacity.getNodeValue(0, firstNodeValue);
  const firstNodeOpacity = firstNodeValue[1];

  for (let i = 0; i < opacitySize; i++) {
    const currentNodeValue = [];
    volumeOpacity.getNodeValue(0, currentNodeValue);
    if (currentNodeValue[1] !== firstNodeOpacity) {
      return false;
    }
  }

  return true;
};

/**
 * Gets window levels data for a viewport
 */
export const getWindowLevelsData = async (
  viewport: Types.IStackViewport | Types.IVolumeViewport,
  viewportInfo: any,
  getVolumeOpacity: (viewport: any, volumeId: string) => number | undefined
) => {
  if (!viewport) {
    return [];
  }

  const volumeIds = (viewport as Types.IBaseVolumeViewport).getAllVolumeIds();
  const viewportProperties = viewport.getProperties();
  const { voiRange } = viewportProperties;
  const viewportVoi = voiRange
    ? {
        windowWidth: voiRange.upper - voiRange.lower,
        windowCenter: voiRange.lower + (voiRange.upper - voiRange.lower) / 2,
      }
    : undefined;

  const windowLevels = await Promise.all(
    volumeIds.map(async (volumeId, volumeIndex) => {
      const volume = cs3DCache.getVolume(volumeId);

      const opacity = getVolumeOpacity(viewport, volumeId);
      const { metadata, scaling } = volume;
      const modality = metadata.Modality;

      const options = {
        min: modality === 'PT' ? 0.1 : -999,
        max: modality === 'PT' ? 5 : 10000,
      };

      const histogram = await getViewportVolumeHistogram(viewport, volume, options);

      if (!histogram || histogram.range.min === histogram.range.max) {
        return null;
      }

      if (!viewportInfo.displaySetOptions || !viewportInfo.displaySetOptions[volumeIndex]) {
        return null;
      }

      const { voi: displaySetVOI, colormap: displaySetColormap } =
        viewportInfo.displaySetOptions[volumeIndex];

      let colormap;
      if (displaySetColormap) {
        colormap =
          csUtils.colormap.getColormap(displaySetColormap.name) ??
          vtkColorMaps.getPresetByName(displaySetColormap.name);
      }

      const voi = !volumeIndex ? (viewportVoi ?? displaySetVOI) : displaySetVOI;

      return {
        viewportId: viewportInfo.viewportId,
        modality,
        volumeId,
        volumeIndex,
        voi,
        histogram,
        colormap,
        step: scaling?.PT ? 0.05 : 1,
        opacity,
        showOpacitySlider: volumeIndex === 1 && opacity !== undefined,
      };
    })
  );

  return windowLevels.filter(Boolean);
};
