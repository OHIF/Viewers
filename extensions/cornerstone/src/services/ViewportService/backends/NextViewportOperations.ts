import {
  utilities as csUtils,
  CONSTANTS as csConstants,
  Types as CoreTypes,
} from '@cornerstonejs/core';
import { getViewportAdapter } from '../adapter';
import { legacyViewportOperations } from './LegacyViewportOperations';
import type {
  IViewportOperations,
  FlipValue,
  RotationMode,
  VolumeLightingOptions,
  WindowLevelParams,
  ColormapParams,
} from './IViewportOperations';

// Native PLANAR_NEXT semantic accessors not covered by the viewport adapter.
// They live on IGenericViewport, so cast structurally at the boundary.
type NativePlanarViewport = CoreTypes.IViewport & {
  resetViewState?: () => void;
  resetDisplaySetPresentation?: (dataId?: string) => void;
  getZoom?: () => number;
  setZoom?: (zoom: number) => void;
};

/**
 * Native ("next") lane of IViewportOperations for direct PLANAR_NEXT viewports.
 * Appearance and camera/view-state ops go through the viewport adapter (which
 * encapsulates the native getViewState/setViewState and
 * getDisplaySetPresentation/setDisplaySetPresentation primitives, including the
 * active-binding dataId default); the remaining ops use the native semantic API
 * directly. The dispatcher only routes generic viewports here.
 *
 * No method calls viewport.render() — the command renders.
 */
export const nextViewportOperations: IViewportOperations = {
  flipHorizontal(viewport: CoreTypes.IViewport, newValue: FlipValue = 'toggle'): void {
    const adapter = getViewportAdapter(viewport);
    const flipHorizontal =
      newValue === 'toggle' ? !adapter.getViewState().flipHorizontal : newValue;
    adapter.setViewState({ flipHorizontal });
  },

  flipVertical(viewport: CoreTypes.IViewport, newValue: FlipValue = 'toggle'): void {
    const adapter = getViewportAdapter(viewport);
    const flipVertical = newValue === 'toggle' ? !adapter.getViewState().flipVertical : newValue;
    adapter.setViewState({ flipVertical });
  },

  invert(viewport: CoreTypes.IViewport): void {
    const adapter = getViewportAdapter(viewport);
    const { invert } = adapter.getPresentation();
    adapter.setPresentation({ invert: !invert });
  },

  rotate(viewport: CoreTypes.IViewport, rotation: number, mode: RotationMode = 'apply'): void {
    // rotation/flip live in the semantic view state; getViewPresentation is absent.
    const adapter = getViewportAdapter(viewport);
    const state = adapter.getViewState();
    const currentRotation = (state.rotation as number) ?? 0;
    const newRotation =
      mode === 'apply'
        ? (currentRotation + rotation + 360) % 360
        : (() => {
            const flipsParity = (state.flipHorizontal ? 1 : 0) + (state.flipVertical ? 1 : 0);
            const effectiveRotation = flipsParity % 2 === 1 ? -rotation : rotation;
            return (effectiveRotation + 360) % 360;
          })();
    adapter.setViewState({ rotation: newRotation });
  },

  reset(viewport: CoreTypes.IViewport): void {
    const vp = viewport as NativePlanarViewport;
    // Reset the per-display-set presentation (VOI/colormap/invert) to defaults.
    vp.resetDisplaySetPresentation?.();
    // No resetCamera on PLANAR_NEXT; resetViewState resets pan/zoom/rotation/orientation/flip.
    vp.resetViewState?.();
  },

  scaleBy(viewport: CoreTypes.IViewport, direction: number): void {
    // parallelScale and zoom are inversely related (smaller parallelScale = more
    // zoomed in = larger zoom), so divide by scaleFactor to match the legacy direction.
    const scaleFactor = direction > 0 ? 0.9 : 1.1;
    const vp = viewport as unknown as {
      getZoom?: () => number;
      setZoom?: (zoom: number) => void;
      resetViewState?: () => void;
    };
    if (direction) {
      // Zoom is only meaningful on planar (stack / volume-slice / MPR) native viewports.
      // VolumeViewport3D is also a generic viewport but exposes no getZoom/setZoom, so
      // guard before calling — a no-op there matches the legacy lane, which only zoomed
      // stack viewports (otherwise the zoom hotkey would throw on a native 3D viewport).
      if (vp.getZoom && vp.setZoom) {
        vp.setZoom(vp.getZoom() / scaleFactor);
      }
    } else {
      vp.resetViewState?.();
    }
  },

  getViewPlaneNormal(viewport: CoreTypes.IViewport): CoreTypes.Point3 | undefined {
    return getViewportAdapter(viewport).getViewPlaneNormal();
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
    // Target the binding for params.displaySetInstanceUID so a PT/CT *fusion* W/L lands
    // on the intended layer (e.g. the PT overlay) instead of always the source (CT) —
    // mirroring setColormap. When no id is given (single stack/volume) the adapter falls
    // back to the source binding.
    getViewportAdapter(viewport).setPresentation(
      { voiRange: { upper, lower } },
      params.displaySetInstanceUID
    );
  },

  setColormap(viewport: CoreTypes.IViewport, params: ColormapParams): void {
    // Target the binding for params.displaySetInstanceUID. OHIF's dataId scheme maps a
    // display set 1:1 onto its native dataId (bare UID), so a PT/CT *fusion* colormap lands
    // on the overlay (PT) binding instead of defaulting to the source (CT). When no id is
    // given (single-volume / plain stack colormap) the adapter falls back to the source.
    getViewportAdapter(viewport).setPresentation(
      { colormap: params.colormap },
      params.displaySetInstanceUID
    );
  },

  setPreset(viewport: CoreTypes.IViewport, preset: string): void {
    // The native VolumeViewport3D has no setProperties; apply the volume-rendering
    // preset (RGBA transfer function) to the volume actor directly.
    const presetObj = csConstants.VIEWPORT_PRESETS?.find(p => p.name === preset);
    const actor = (
      viewport as unknown as { getDefaultActor?: () => { actor?: unknown } | undefined }
    ).getDefaultActor?.()?.actor;
    if (presetObj && actor) {
      csUtils.applyPreset(actor as Parameters<typeof csUtils.applyPreset>[0], presetObj);
    }
  },

  // VR sample-distance / opacity-points / lighting operate on the vtk volume actor via
  // getActors, which the native VolumeViewport3D exposes; the work is lane-agnostic, so
  // reuse the legacy actor-based implementations.
  setVolumeRenderingQuality(viewport: CoreTypes.IViewport, volumeQuality: number): void {
    legacyViewportOperations.setVolumeRenderingQuality(viewport, volumeQuality);
  },

  shiftVolumeOpacityPoints(viewport: CoreTypes.IViewport, shift: number): void {
    legacyViewportOperations.shiftVolumeOpacityPoints(viewport, shift);
  },

  setVolumeLighting(viewport: CoreTypes.IViewport, options: VolumeLightingOptions): void {
    legacyViewportOperations.setVolumeLighting(viewport, options);
  },
};
