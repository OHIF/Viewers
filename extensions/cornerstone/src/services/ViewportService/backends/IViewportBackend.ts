import type { Types } from '@cornerstonejs/core';
import type ViewportInfo from '../Viewport';
import type {
  Presentations,
  PositionPresentation,
  LutPresentation,
} from '../../../types/Presentation';
import type { StackViewportData, VolumeViewportData } from '../../../types/CornerstoneCacheService';
import type { DataIdPayload } from './dataIdRegistry';

/** A pending overlay (SEG/RTSTRUCT) add produced by the service's prelude. */
export type OverlayMountTask = {
  imageIds?: string[];
  addOverlayFn?: () => Promise<void>;
};

/**
 * Everything the service's lane-agnostic stack-mount prelude computes: the
 * backend receives it ready-made and performs only the lane-specific mount.
 */
export interface StackMountContext {
  /** All display set UIDs bound to the viewport (first = the stack source). */
  displaySetInstanceUIDs: string[];
  imageIds: string[];
  /** Resolved initial slice (position presentation / view reference / HP options). */
  initialImageIndex: number;
  /** VOI/invert/colormap seeded from the LUT presentation or display set options. */
  properties: Record<string, unknown>;
  displayArea?: unknown;
  rotation?: number;
  flipHorizontal?: boolean;
  presentations: Presentations;
  viewportInfo: ViewportInfo;
  overlayProcessingResults?: OverlayMountTask[];
}

/**
 * Everything the service's lane-agnostic volume-mount prelude computes before
 * the lane fork in setVolumesForViewport.
 */
export interface VolumeMountContext {
  /** Volume inputs with their display set options, overlays already filtered out. */
  filteredVolumeInputArray: Array<{
    volumeInput: {
      imageIds?: string[];
      volumeId: string;
      displaySetInstanceUID: string;
      blendMode?: unknown;
      slabThickness?: number;
      [key: string]: unknown;
    };
    displaySetOptions: unknown;
  }>;
  /** Per-volume VOI/invert/colormap/preset derived from the display set options. */
  volumesProperties: Array<{ properties: Record<string, unknown>; volumeId: string }>;
  viewportInfo: ViewportInfo;
  overlayProcessingResults?: OverlayMountTask[];
  presentations: Presentations;
}

/**
 * Selects how OHIF drives cornerstone viewports (migration plan §4.3). One
 * implementation is chosen ONCE, lazily on first use (a `get backend()` getter on
 * CornerstoneViewportService — NOT the constructor, because the service singleton is
 * built during extension registration before init.tsx sets the flag), from
 * `appConfig.useNextViewports`:
 *   - LegacyViewportBackend: today's behavior, selected when the flag is off (default).
 *   - NextViewportBackend: the native GenericViewport ("next") path.
 *
 * The service holds exactly one backend for its lifetime and routes the forked
 * concerns through it: mount dispatch, the per-family MOUNT BODIES
 * (mountStack/mountVolumes/mountEcg/mountOther/remount), presentation
 * capture/restore, and the native dataId lifecycle. The service keeps only the
 * lane-agnostic preludes (option/property derivation, bookkeeping, events) and
 * the genuinely shared volume tail; it contains no per-lane branches itself.
 */
export interface IViewportBackend {
  /**
   * Routes a viewport's data to the correct per-family mount. Legacy routes by the
   * runtime cornerstone viewport type; next routes by the bound data shape, because
   * native stack and volume content both report a single PLANAR_NEXT type (§4.4).
   */
  dispatchMount(
    viewport: Types.IViewport,
    viewportData: StackViewportData | VolumeViewportData,
    viewportInfo: ViewportInfo,
    presentations?: Presentations
  ): Promise<void>;

  /**
   * Mounts an image stack. Legacy: setStack/setProperties/setPresentations +
   * displayArea/rotation/flip via the camera surface. Next: register the dataId,
   * setDisplaySets, seed VOI from metadata, apply presentation + view state.
   */
  mountStack(viewport: Types.IStackViewport, context: StackMountContext): Promise<void>;

  /**
   * Lane-specific volume mount. Next mounts the volumes natively (registered
   * dataIds + one setDisplaySets call + per-binding presentations) and returns
   * true — the service then only broadcasts. Legacy returns false, and the
   * service runs the shared volume tail (setVolumes/addVolumes optimization,
   * property application, presentations, jumpToSlice), which a native
   * overlay-only mount also traverses safely.
   */
  mountVolumes(viewport: Types.IViewport, context: VolumeMountContext): Promise<boolean>;

  /**
   * The shared volume tail's overlay-only fallback: when every volume input is
   * an overlay display set, legacy still mounts them via setVolumes; next
   * no-ops (its overlays are added via the segmentation representations).
   */
  mountOverlayOnlyVolumes(viewport: Types.IViewport, volumeInputArray: unknown[]): Promise<void>;

  /**
   * Mounts an ECG waveform. Legacy: viewport.setEcg(imageId). Next: register
   * the display set's dataId and mount through the generic setDisplaySets API.
   */
  mountEcg(
    viewport: Types.IECGViewport,
    displaySet: { displaySetInstanceUID: string; imageIds?: string[] },
    imageId: string
  ): Promise<void>;

  /**
   * Mounts video / whole-slide content (the caller applies the view reference
   * afterwards). Legacy keys the displaySetId off imageIds[0]; next registers
   * the family-specific dataId first.
   */
  mountOther(
    viewport: Types.IViewport,
    displaySet: { displaySetInstanceUID: string; imageIds: string[] }
  ): Promise<void>;

  /**
   * Re-mounts changed viewport data onto an existing viewport (updateViewport),
   * optionally restoring the camera afterwards. Legacy snapshots getCamera and
   * dispatches by runtime type; next snapshots the semantic view state and
   * routes through dispatchMount. May return undefined when the viewport family
   * has no re-mount path (matching the historical legacy behavior).
   */
  remount(
    viewport: Types.IViewport,
    viewportData: StackViewportData | VolumeViewportData,
    viewportInfo: ViewportInfo,
    keepCamera: boolean
  ): Promise<void> | undefined;

  /**
   * Reads the position presentation (camera/zoom/pan + view reference) to persist
   * for restore. Legacy uses getViewPresentation (pan/zoom); native stores the
   * semantic view-state displayArea (pan/zoom) since it has no getViewPresentation.
   */
  getPositionPresentation(
    csViewport: Types.IViewport,
    viewportInfo: ViewportInfo,
    viewportId: string
  ): PositionPresentation;

  /**
   * Restores a position presentation. Both apply the view reference (slice/
   * orientation); legacy then applies getViewPresentation via setViewPresentation,
   * native applies the stored displayArea via setViewState.
   */
  setPositionPresentation(
    viewport: Types.IViewport,
    positionPresentation: PositionPresentation
  ): void;

  /**
   * Restores a LUT presentation (VOI/colormap/invert). Legacy uses setProperties;
   * native uses setDisplaySetPresentation (a PLANAR_NEXT viewport has no
   * setProperties), so calling setPresentations on native no longer throws.
   */
  setLutPresentation(viewport: Types.IViewport, lutPresentation: LutPresentation): void;

  /**
   * Registers a native dataset id for a viewport against cornerstone's global
   * GenericViewport metadata provider (§4.7). Next ref-counts and tracks per
   * viewport so it can be released on unmount; legacy is a no-op (never registers).
   */
  registerDataId(viewportId: string, dataId: string, payload: DataIdPayload): void;

  /**
   * Releases the dataset registrations a viewport owns. Called from the service's
   * disableElement BEFORE the viewport bookkeeping is deleted. Next releases (and
   * removes from the provider when the last reference is gone); legacy is a no-op.
   */
  onViewportDisabled(viewportId: string): void;

  /**
   * Flushes all remaining registrations. Called from the service's destroy().
   * Next clears its registry; legacy is a no-op.
   */
  destroy(): void;
}
