import { utilities as csUtils, Types as CoreTypes } from '@cornerstonejs/core';
import { mat4, vec3 } from 'gl-matrix';
import {
  isStackViewportType,
  isVolumeViewportType,
  isOrthographicViewportType,
} from '../../../utils/getLegacyViewportType';
import { getCenterExtent } from '../../../utils/getCenterExtent';
import { isMeasurementWithinViewport } from '../../../utils/isMeasurementWithinViewport';
import type {
  IViewportOperations,
  FlipValue,
  RotationMode,
  VolumeLightingOptions,
  WindowLevelParams,
  ColormapParams,
} from './IViewportOperations';

// Loose view of the VTK actor/mapper/property chain used by the 3D VR ops. These
// live on vtk.js objects, not cornerstone types, so they are accessed structurally
// (mirrors the previously-untyped commandsModule bodies).
type VtkActorChain = {
  actor: {
    getMapper: () => Record<string, (...args: unknown[]) => unknown>;
    getProperty: () => Record<string, (...args: unknown[]) => unknown>;
  };
};

/**
 * Legacy lane of IViewportOperations: every method is the corresponding
 * commandsModule body lifted verbatim, using the legacy cornerstone APIs directly
 * (getCamera/setCamera, getProperties/setProperties, getViewPresentation/
 * setViewPresentation, resetCamera, getActors). This is the byte-identical flag-off
 * path; the dispatcher only routes non-generic viewports here.
 *
 * No method calls viewport.render() — the command renders (matching per-command
 * render timing).
 */
export const legacyViewportOperations: IViewportOperations = {
  flipHorizontal(viewport: CoreTypes.IViewport, newValue: FlipValue = 'toggle'): void {
    const vp = viewport as CoreTypes.IStackViewport;
    let flipHorizontal: boolean;
    if (newValue === 'toggle') {
      flipHorizontal = !vp.getCamera().flipHorizontal;
    } else {
      flipHorizontal = newValue;
    }
    vp.setCamera({ flipHorizontal });
  },

  flipVertical(viewport: CoreTypes.IViewport, newValue: FlipValue = 'toggle'): void {
    const vp = viewport as CoreTypes.IStackViewport;
    let flipVertical: boolean;
    if (newValue === 'toggle') {
      flipVertical = !vp.getCamera().flipVertical;
    } else {
      flipVertical = newValue;
    }
    vp.setCamera({ flipVertical });
  },

  invert(viewport: CoreTypes.IViewport): void {
    const vp = viewport as CoreTypes.IStackViewport;
    const { invert } = vp.getProperties();
    vp.setProperties({ invert: !invert });
  },

  rotate(viewport: CoreTypes.IViewport, rotation: number, mode: RotationMode = 'apply'): void {
    if (isVolumeViewportType(viewport)) {
      const vp = viewport as CoreTypes.IVolumeViewport;
      const camera = vp.getCamera();
      const rotAngle = (rotation * Math.PI) / 180;
      const rotMat = mat4.identity(new Float32Array(16));
      mat4.rotate(rotMat, rotMat, rotAngle, camera.viewPlaneNormal);
      const rotatedViewUp = vec3.transformMat4(vec3.create(), camera.viewUp, rotMat);
      vp.setCamera({ viewUp: rotatedViewUp as CoreTypes.Point3 });
      return;
    }

    const vp = viewport as CoreTypes.IStackViewport;
    if (vp.getRotation !== undefined) {
      const { rotation: currentRotation } = vp.getViewPresentation();
      const newRotation =
        mode === 'apply'
          ? (currentRotation + rotation + 360) % 360
          : (() => {
              // In 'set' mode, account for the effect horizontal/vertical flips
              // have on the perceived rotation direction. A single flip mirrors
              // the image and inverses rotation direction, while two flips
              // restore the original parity. We therefore invert the rotation
              // angle when an odd number of flips are applied so that the
              // requested absolute rotation matches the user expectation.
              const { flipHorizontal = false, flipVertical = false } = vp.getViewPresentation();

              const flipsParity = (flipHorizontal ? 1 : 0) + (flipVertical ? 1 : 0);
              const effectiveRotation = flipsParity % 2 === 1 ? -rotation : rotation;

              return (effectiveRotation + 360) % 360;
            })();
      vp.setViewPresentation({ rotation: newRotation });
    }
  },

  reset(viewport: CoreTypes.IViewport): void {
    const vp = viewport as CoreTypes.IStackViewport;
    vp.resetProperties?.();
    vp.resetCamera();
  },

  scaleBy(viewport: CoreTypes.IViewport, direction: number): void {
    const scaleFactor = direction > 0 ? 0.9 : 1.1;
    if (isStackViewportType(viewport)) {
      const vp = viewport as CoreTypes.IStackViewport;
      if (direction) {
        const { parallelScale } = vp.getCamera();
        vp.setCamera({ parallelScale: parallelScale * scaleFactor });
      } else {
        vp.resetCamera();
      }
    }
  },

  getViewPlaneNormal(viewport: CoreTypes.IViewport): CoreTypes.Point3 | undefined {
    return (viewport as CoreTypes.IStackViewport).getCamera().viewPlaneNormal;
  },

  centerOnMeasurement(
    viewport: CoreTypes.IViewport,
    measurement: Record<string, unknown>
  ): boolean {
    if (isMeasurementWithinViewport(viewport, measurement)) {
      return false;
    }

    const vp = viewport as CoreTypes.IStackViewport;
    const camera = vp.getCamera();
    const { focalPoint: cameraFocalPoint, position: cameraPosition } = camera;
    const { center, extent } = getCenterExtent(measurement);
    const position = vec3.sub(vec3.create(), cameraPosition, cameraFocalPoint);
    vec3.add(position, position, center);
    vp.setCamera({ focalPoint: center, position: position as unknown as CoreTypes.Point3 });
    // Zoom out if the measurement is too large
    const measurementSize = vec3.dist(extent.min, extent.max);
    if (measurementSize > camera.parallelScale) {
      const scaleFactor = measurementSize / camera.parallelScale;
      vp.setZoom(vp.getZoom() / scaleFactor);
    }
    return true;
  },

  setWindowLevel(viewport: CoreTypes.IViewport, params: WindowLevelParams): void {
    const { lower, upper } = csUtils.windowLevel.toLowHighRange(
      params.windowWidth,
      params.windowCenter
    );
    if (isVolumeViewportType(viewport)) {
      (viewport as CoreTypes.IVolumeViewport).setProperties(
        { voiRange: { upper, lower } },
        params.volumeId
      );
    } else {
      (viewport as CoreTypes.IStackViewport).setProperties({ voiRange: { upper, lower } });
    }
  },

  setColormap(viewport: CoreTypes.IViewport, params: ColormapParams): void {
    const { colormap, displaySetInstanceUID } = params;
    if (isStackViewportType(viewport)) {
      (viewport as CoreTypes.IStackViewport).setProperties({ colormap });
    }

    if (isOrthographicViewportType(viewport)) {
      const vp = viewport as CoreTypes.IVolumeViewport;
      // ToDo: Find a better way of obtaining the volumeId that corresponds to the displaySetInstanceUID
      const volumeId =
        vp.getAllVolumeIds().find((_volumeId: string) => _volumeId.includes(displaySetInstanceUID)) ??
        vp.getVolumeId();
      vp.setProperties({ colormap }, volumeId);
    }
  },

  setPreset(viewport: CoreTypes.IViewport, preset: string): void {
    (viewport as CoreTypes.IVolumeViewport).setProperties({ preset });
  },

  setVolumeRenderingQuality(viewport: CoreTypes.IViewport, volumeQuality: number): void {
    const { actor } = (viewport as unknown as CoreTypes.IVolumeViewport).getActors()[0];
    const mapper = (actor as unknown as VtkActorChain['actor']).getMapper();
    const image = mapper.getInputData() as {
      getDimensions: () => number[];
      getSpacing: () => number[];
    };
    const dims = image.getDimensions();
    const spacing = image.getSpacing();
    const spatialDiagonal = vec3.length(
      vec3.fromValues(dims[0] * spacing[0], dims[1] * spacing[1], dims[2] * spacing[2])
    );

    let sampleDistance = spacing.reduce((a, b) => a + b) / 3.0;
    sampleDistance /= volumeQuality > 1 ? 0.5 * volumeQuality ** 2 : 1.0;
    const samplesPerRay = spatialDiagonal / sampleDistance + 1;
    mapper.setMaximumSamplesPerRay(samplesPerRay);
    mapper.setSampleDistance(sampleDistance);
  },

  shiftVolumeOpacityPoints(viewport: CoreTypes.IViewport, shift: number): void {
    const { actor } = (viewport as unknown as CoreTypes.IVolumeViewport).getActors()[0];
    const ofun = (actor as unknown as VtkActorChain['actor']).getProperty().getScalarOpacity(0) as {
      getSize: () => number;
      getNodeValue: (i: number, v: number[]) => void;
      removeAllPoints: () => void;
      addPoint: (...args: number[]) => void;
    };

    const opacityPointValues: number[][] = []; // Array to hold values
    // Gather Existing Values
    const size = ofun.getSize();
    for (let pointIdx = 0; pointIdx < size; pointIdx++) {
      const opacityPointValue = [0, 0, 0, 0];
      ofun.getNodeValue(pointIdx, opacityPointValue);
      // opacityPointValue now holds [xLocation, opacity, midpoint, sharpness]
      opacityPointValues.push(opacityPointValue);
    }
    // Add offset
    opacityPointValues.forEach(opacityPointValue => {
      opacityPointValue[0] += shift; // Change the location value
    });
    // Set new values
    ofun.removeAllPoints();
    opacityPointValues.forEach(opacityPointValue => {
      ofun.addPoint(...opacityPointValue);
    });
  },

  setVolumeLighting(viewport: CoreTypes.IViewport, options: VolumeLightingOptions): void {
    const { actor } = (viewport as unknown as CoreTypes.IVolumeViewport).getActors()[0];
    const property = (actor as unknown as VtkActorChain['actor']).getProperty() as {
      setShade: (v: boolean) => void;
      setAmbient: (v: number) => void;
      setDiffuse: (v: number) => void;
      setSpecular: (v: number) => void;
    };

    if (options.shade !== undefined) {
      property.setShade(options.shade);
    }

    if (options.ambient !== undefined) {
      property.setAmbient(options.ambient);
    }

    if (options.diffuse !== undefined) {
      property.setDiffuse(options.diffuse);
    }

    if (options.specular !== undefined) {
      property.setSpecular(options.specular);
    }
  },
};
