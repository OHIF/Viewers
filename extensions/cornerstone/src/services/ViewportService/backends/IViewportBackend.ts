import type { Types } from '@cornerstonejs/core';
import type ViewportInfo from '../Viewport';
import type {
  Presentations,
  PositionPresentation,
  LutPresentation,
} from '../../../types/Presentation';
import type {
  StackViewportData,
  VolumeViewportData,
} from '../../../types/CornerstoneCacheService';
import type { DataIdPayload } from './dataIdRegistry';

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
 * concerns (mount dispatch, native dataId lifecycle) through it. The flag is read
 * only here and in getCornerstoneViewportType (the two sanctioned reads, §4.2).
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
