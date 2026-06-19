import { utilities as csUtils, Types as CoreTypes } from '@cornerstonejs/core';
import {
  getViewportProperties,
  setViewportProperties,
  getViewportCameraState,
  setViewportCameraState,
} from '../../../utils/getViewportPresentation';
import type {
  IViewportOperations,
  FlipValue,
  RotationMode,
  VolumeLightingOptions,
  WindowLevelParams,
  ColormapParams,
} from './IViewportOperations';

// Native PLANAR_NEXT semantic accessors not covered by the presentation/camera-state
// bridges. They live on IGenericViewport, so cast structurally at the boundary.
type NativePlanarViewport = CoreTypes.IViewport & {
  getViewReference?: () => CoreTypes.ViewReference;
  resetViewState?: () => void;
  resetProperties?: () => void;
  getZoom?: () => number;
  setZoom?: (zoom: number) => void;
};

// CS-14: native VR has no vtk volume-actor pipeline yet, so the 3D volume-rendering
// ops cannot run on a native viewport. Warn once per op (these are reached from
// VR property sliders; a throw could wedge the panel) and no-op. Remove the gate
// when native VR (CS-14) lands. `grep -rn "CS-14" extensions/cornerstone/src` lists them.
const warnedVrOps = new Set<string>();
function warnVrUnsupported(op: string): void {
  if (warnedVrOps.has(op)) {
    return;
  }
  warnedVrOps.add(op);
  console.warn(
    `[viewportOperations] ${op} is not supported on next (PLANAR_NEXT) viewports yet (CS-14); skipping.`
  );
}

/**
 * Native ("next") lane of IViewportOperations for direct PLANAR_NEXT viewports.
 * Appearance and camera/view-state ops go through the getViewportPresentation
 * bridges (which encapsulate the native getViewState/setViewState and
 * getDisplaySetPresentation/setDisplaySetPresentation primitives, including the
 * active-binding dataId default); the remaining ops use the native semantic API
 * directly. The dispatcher only routes generic viewports here.
 *
 * No method calls viewport.render() — the command renders.
 */
export const nextViewportOperations: IViewportOperations = {
  flipHorizontal(viewport: CoreTypes.IViewport, newValue: FlipValue = 'toggle'): void {
    const flipHorizontal =
      newValue === 'toggle' ? !getViewportCameraState(viewport).flipHorizontal : newValue;
    setViewportCameraState(viewport, { flipHorizontal });
  },

  flipVertical(viewport: CoreTypes.IViewport, newValue: FlipValue = 'toggle'): void {
    const flipVertical =
      newValue === 'toggle' ? !getViewportCameraState(viewport).flipVertical : newValue;
    setViewportCameraState(viewport, { flipVertical });
  },

  invert(viewport: CoreTypes.IViewport): void {
    const { invert } = getViewportProperties(viewport);
    setViewportProperties(viewport, { invert: !invert });
  },

  rotate(viewport: CoreTypes.IViewport, rotation: number, mode: RotationMode = 'apply'): void {
    // rotation/flip live in the semantic view state; getViewPresentation is absent.
    const state = getViewportCameraState(viewport);
    const currentRotation = (state.rotation as number) ?? 0;
    const newRotation =
      mode === 'apply'
        ? (currentRotation + rotation + 360) % 360
        : (() => {
            const flipsParity = (state.flipHorizontal ? 1 : 0) + (state.flipVertical ? 1 : 0);
            const effectiveRotation = flipsParity % 2 === 1 ? -rotation : rotation;
            return (effectiveRotation + 360) % 360;
          })();
    setViewportCameraState(viewport, { rotation: newRotation });
  },

  reset(viewport: CoreTypes.IViewport): void {
    const vp = viewport as NativePlanarViewport;
    vp.resetProperties?.();
    // No resetCamera on PLANAR_NEXT; resetViewState resets pan/zoom/rotation/orientation/flip.
    vp.resetViewState?.();
  },

  scaleBy(viewport: CoreTypes.IViewport, direction: number): void {
    // parallelScale and zoom are inversely related (smaller parallelScale = more
    // zoomed in = larger zoom), so divide by scaleFactor to match the legacy direction.
    const scaleFactor = direction > 0 ? 0.9 : 1.1;
    const vp = viewport as unknown as {
      getZoom: () => number;
      setZoom: (zoom: number) => void;
      resetViewState?: () => void;
    };
    if (direction) {
      vp.setZoom(vp.getZoom() / scaleFactor);
    } else {
      vp.resetViewState?.();
    }
  },

  getViewPlaneNormal(viewport: CoreTypes.IViewport): CoreTypes.Point3 | undefined {
    return (viewport as NativePlanarViewport).getViewReference?.()?.viewPlaneNormal as
      | CoreTypes.Point3
      | undefined;
  },

  centerOnMeasurement(): boolean {
    // CS-14: native PLANAR_NEXT has no getCamera/setCamera for in-plane pan; the
    // caller's setViewReference already navigated to the measurement's slice.
    // TODO(next): port in-plane centering via the camera bridge + setViewState pan.
    return false;
  },

  setWindowLevel(viewport: CoreTypes.IViewport, params: WindowLevelParams): void {
    const { lower, upper } = csUtils.windowLevel.toLowHighRange(
      params.windowWidth,
      params.windowCenter
    );
    // Native stack and volume both apply the VOI on the active binding via the bridge.
    setViewportProperties(viewport, { voiRange: { upper, lower } });
  },

  setColormap(viewport: CoreTypes.IViewport, params: ColormapParams): void {
    setViewportProperties(viewport, { colormap: params.colormap });
  },

  setPreset(): void {
    warnVrUnsupported('setPreset'); // CS-14
  },

  setVolumeRenderingQuality(): void {
    warnVrUnsupported('setVolumeRenderingQuality'); // CS-14
  },

  shiftVolumeOpacityPoints(): void {
    warnVrUnsupported('shiftVolumeOpacityPoints'); // CS-14
  },

  setVolumeLighting(): void {
    warnVrUnsupported('setVolumeLighting'); // CS-14
  },
};
