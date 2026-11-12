import { Types as CoreTypes } from '@cornerstonejs/core';
import { isNextViewport } from '../adapter';
import type {
  IViewportOperations,
  FlipValue,
  RotationMode,
  VolumeLightingOptions,
  WindowLevelParams,
  ColormapParams,
} from './IViewportOperations';
import { legacyViewportOperations } from './LegacyViewportOperations';
import { nextViewportOperations } from './NextViewportOperations';

/**
 * Picks the operations lane for a SPECIFIC viewport. Unlike the IViewportBackend
 * lifecycle backend (selected once by the appConfig flag because it owns the
 * per-session mount), operations route per viewport: the viewport is already created
 * and self-describing, and a session can hold both legacy and native viewports.
 */
function backendFor(viewport: CoreTypes.IViewport): IViewportOperations {
  return isNextViewport(viewport) ? nextViewportOperations : legacyViewportOperations;
}

/**
 * Singleton facade over the legacy/next operations backends. commandsModule (and any
 * other caller) imports this and calls e.g. `viewportOperations.flipHorizontal(viewport)`,
 * keeping native-vs-legacy interaction logic out of the command bodies (migration §4.3).
 * Stateless and dependency-free (each op takes an already-resolved viewport), so it is a
 * plain singleton rather than a registered service.
 */
export const viewportOperations: IViewportOperations = {
  flipHorizontal: (viewport: CoreTypes.IViewport, newValue?: FlipValue) =>
    backendFor(viewport).flipHorizontal(viewport, newValue),

  flipVertical: (viewport: CoreTypes.IViewport, newValue?: FlipValue) =>
    backendFor(viewport).flipVertical(viewport, newValue),

  invert: (viewport: CoreTypes.IViewport) => backendFor(viewport).invert(viewport),

  rotate: (viewport: CoreTypes.IViewport, rotation: number, mode?: RotationMode) =>
    backendFor(viewport).rotate(viewport, rotation, mode),

  reset: (viewport: CoreTypes.IViewport) => backendFor(viewport).reset(viewport),

  scaleBy: (viewport: CoreTypes.IViewport, direction: number) =>
    backendFor(viewport).scaleBy(viewport, direction),

  getViewPlaneNormal: (viewport: CoreTypes.IViewport) =>
    backendFor(viewport).getViewPlaneNormal(viewport),

  centerOnMeasurement: (viewport: CoreTypes.IViewport, measurement: Record<string, unknown>) =>
    backendFor(viewport).centerOnMeasurement(viewport, measurement),

  setWindowLevel: (viewport: CoreTypes.IViewport, params: WindowLevelParams) =>
    backendFor(viewport).setWindowLevel(viewport, params),

  setColormap: (viewport: CoreTypes.IViewport, params: ColormapParams) =>
    backendFor(viewport).setColormap(viewport, params),

  setPreset: (viewport: CoreTypes.IViewport, preset: string) =>
    backendFor(viewport).setPreset(viewport, preset),

  setVolumeRenderingQuality: (viewport: CoreTypes.IViewport, volumeQuality: number) =>
    backendFor(viewport).setVolumeRenderingQuality(viewport, volumeQuality),

  shiftVolumeOpacityPoints: (viewport: CoreTypes.IViewport, shift: number) =>
    backendFor(viewport).shiftVolumeOpacityPoints(viewport, shift),

  setVolumeLighting: (viewport: CoreTypes.IViewport, options: VolumeLightingOptions) =>
    backendFor(viewport).setVolumeLighting(viewport, options),
};
