import type { Types } from '@cornerstonejs/core';
import type ViewportInfo from '../Viewport';
import type { Presentations } from '../../../types/Presentation';
import type { StackViewportData, VolumeViewportData } from '../../../types/CornerstoneCacheService';
import type { OverlayMountTask } from './IViewportBackend';

/**
 * The narrow slice of CornerstoneViewportService that a viewport backend is
 * allowed to reach (migration plan §4.3 access pattern). The service `implements`
 * this and passes `this` to each backend, so a backend can dispatch the per-family
 * mount work back to the shared service methods without reaching into unrelated
 * internals. Keeping this interface narrow is what stops the off (legacy) path
 * from drifting as the next backend grows.
 */
export interface IViewportServiceInternals {
  _setStackViewport(
    viewport: Types.IStackViewport,
    viewportData: StackViewportData,
    viewportInfo: ViewportInfo,
    presentations?: Presentations
  ): Promise<void>;

  _setVolumeViewport(
    viewport: Types.IVolumeViewport,
    viewportData: VolumeViewportData,
    viewportInfo: ViewportInfo,
    presentations?: Presentations
  ): Promise<void>;

  _setEcgViewport(viewport: Types.IECGViewport, viewportData: StackViewportData): Promise<void>;

  _setOtherViewport(
    viewport: Types.IStackViewport,
    viewportData: StackViewportData,
    viewportInfo: ViewportInfo,
    presentations?: Presentations
  ): Promise<void>;

  /** Applies lut/position/segmentation presentations to a mounted viewport. */
  setPresentations(viewportId: string, presentations: Presentations): void;

  /** Runs the pending overlay (SEG/RTSTRUCT) adds produced by the mount prelude. */
  _addOverlayRepresentations(overlayProcessingResults?: OverlayMountTask[]): Promise<void>;

  /** Records which display sets a viewport shows (service bookkeeping). */
  _trackViewportDisplaySets(viewportId: string, displaySetInstanceUIDs: string[]): void;
}
