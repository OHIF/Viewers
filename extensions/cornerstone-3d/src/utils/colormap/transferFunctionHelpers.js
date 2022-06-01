import { cache, utilities } from '@cornerstonejs/core';
import vtkColorMaps from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction/ColorMaps';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';

const colormaps = {};

export function registerColormap(colormap) {
  colormaps[colormap.Name] = colormap;
}

function setColorTransferFunctionFromVolumeMetadata({
  volumeActor,
  volumeId,
  inverted,
}) {
  let lower, upper, windowWidth, windowCenter;

  if (volumeId) {
    const volume = cache.getVolume(volumeId);
    const voiLutModule = volume.metadata.voiLut[0];
    if (voiLutModule) {
      windowWidth = voiLutModule.windowWidth;
      windowCenter = voiLutModule.windowCenter;
    }
  } else {
    windowWidth = 400;
    windowCenter = 40;
  }

  if (windowWidth == undefined || windowCenter === undefined) {
    // Set to something so we can window level it manually.
    lower = 200;
    upper = 400;
  } else {
    lower = windowCenter - windowWidth / 2.0;
    upper = windowCenter + windowWidth / 2.0;
  }

  setLowerUpperColorTransferFunction({ volumeActor, lower, upper, inverted });
}

function setLowerUpperColorTransferFunction({
  volumeActor,
  lower,
  upper,
  inverted,
}) {
  volumeActor
    .getProperty()
    .getRGBTransferFunction(0)
    .setMappingRange(lower, upper);

  if (inverted) {
    utilities.invertRgbTransferFunction(
      volumeActor.getProperty().getRGBTransferFunction(0)
    );
  }
}

function setColormap(volumeActor, colormap) {
  const mapper = volumeActor.getMapper();
  mapper.setSampleDistance(1.0);

  const cfun = vtkColorTransferFunction.newInstance();

  // if we have a custom colormap, use it
  let preset;
  if (colormaps[colormap]) {
    preset = colormaps[colormap];
  } else {
    preset = vtkColorMaps.getPresetByName(colormap);
  }

  cfun.applyColorMap(preset);
  cfun.setMappingRange(0, 5);

  volumeActor.getProperty().setRGBTransferFunction(0, cfun);

  // Create scalar opacity function
  const ofun = vtkPiecewiseFunction.newInstance();
  ofun.addPoint(0, 0.0);
  ofun.addPoint(0.1, 0.9);
  ofun.addPoint(5, 1.0);

  volumeActor.getProperty().setScalarOpacity(0, ofun);
}

export {
  setColormap,
  setColorTransferFunctionFromVolumeMetadata,
  setLowerUpperColorTransferFunction,
};
