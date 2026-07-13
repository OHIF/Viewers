import { Enums, cache, Types as CoreTypes } from '@cornerstonejs/core';
import { isVolume3DViewportType } from '../../../utils/getLegacyViewportType';
import type {
  IViewportAdapter,
  ViewportColormap,
  ViewportPresentation,
  ViewportShape,
  ViewportViewState,
  VOIRange,
} from './IViewportAdapter';

/**
 * Structural view of the native ("next") viewport surface used by the adapter.
 * These accessors live on IGenericViewport (not IViewport), so we cast at this
 * boundary rather than import core-internal PlanarViewport types.
 */
type NativeViewport = CoreTypes.IViewport & {
  getSourceDataId?: () => string | undefined;
  getDisplaySetPresentation?: (dataId: string) => ViewportPresentation | undefined;
  getDefaultVOIRange?: (dataId?: string) => VOIRange | undefined;
  setDisplaySetPresentation?: {
    (props: ViewportPresentation): void;
    (dataId: string, props: ViewportPresentation): void;
  };
  getViewState?: () => ViewportViewState | undefined;
  setViewState?: (patch: ViewportViewState) => void;
  getViewReference?: () => CoreTypes.ViewReference | undefined;
  setViewReference?: (ref: CoreTypes.ViewReference) => void;
  getCurrentMode?: () => string;
  setDisplaySets?: (args: {
    displaySetId: string;
    options?: Record<string, unknown>;
  }) => Promise<void>;
};

const voiRangesClose = (a: VOIRange, b: VOIRange, eps = 0.001): boolean =>
  Math.abs(a.lower - b.lower) < eps && Math.abs(a.upper - b.upper) < eps;

/**
 * Native ("next") lane of IViewportAdapter — a thin pass-through to the native
 * semantic API (view state, per-binding display-set presentation, view
 * reference). Instantiated only by `getViewportAdapter`.
 */
export class NextViewportAdapter implements IViewportAdapter {
  constructor(private readonly viewport: NativeViewport) {}

  // ---- classification ----

  getShape(): ViewportShape {
    if (isVolume3DViewportType(this.viewport)) {
      return 'volume3d';
    }
    const mode = this.viewport.getCurrentMode?.();
    if (mode === 'stack') {
      return 'stack';
    }
    if (mode === 'volume') {
      return 'volume';
    }
    return 'unknown';
  }

  isVolumeRendering(): boolean {
    return this.viewport.getCurrentMode?.() === 'volume';
  }

  canReorientInPlace(): boolean {
    const mode = this.viewport.getCurrentMode?.();
    return mode === 'volume' || mode === 'volume3d';
  }

  isInAcquisitionPlane(): boolean {
    // orientation defaults to ACQUISITION when unset on the native view state.
    const orientation = this.viewport.getViewState?.()?.orientation;
    return orientation === Enums.OrientationAxis.ACQUISITION || orientation == null;
  }

  hasContent(): boolean {
    // Planar native viewports have no getActors (it throws); content presence
    // is reported by the content mode (empty/unknown means nothing bound).
    const mode = this.viewport.getCurrentMode?.();
    return !!mode && mode !== 'empty' && mode !== 'unknown';
  }

  // ---- view geometry ----

  getViewState(): ViewportViewState {
    return this.viewport.getViewState?.() ?? {};
  }

  setViewState(patch: ViewportViewState): void {
    this.viewport.setViewState?.(patch);
  }

  getViewPlaneNormal(): CoreTypes.Point3 | undefined {
    return this.viewport.getViewReference?.()?.viewPlaneNormal as CoreTypes.Point3 | undefined;
  }

  getFocalPoint(): CoreTypes.Point3 | undefined {
    // The native view state carries no focalPoint; it comes from the view reference.
    return this.viewport.getViewReference?.()?.cameraFocalPoint as CoreTypes.Point3 | undefined;
  }

  // ---- per-display-set appearance ----

  getPresentation(dataId?: string): ViewportPresentation {
    const id = dataId ?? this.viewport.getSourceDataId?.();
    const presentation = (id ? this.viewport.getDisplaySetPresentation?.(id) : undefined) ?? {};

    // A native binding's presentation normally holds only EXPLICIT VOI overrides,
    // but a computed default VOI can transiently land here during intermediate
    // mounts (e.g. while a SEG hydrates, the base image briefly mounts as a volume
    // and its min/max default is stored). Flag such a VOI as computed when it
    // matches the binding's default so the LUT-presentation capture (cleanProperties)
    // strips it instead of persisting+restoring it over the real default — matching
    // legacy StackViewport's isComputedVOI. Stamping is harmless even on a genuine
    // user VOI that happens to equal the default (stripping it falls back to the
    // same value).
    const voiRange = presentation.voiRange;
    if (voiRange && presentation.isComputedVOI === undefined) {
      const defaultVOIRange = this.viewport.getDefaultVOIRange?.(id);
      if (defaultVOIRange && voiRangesClose(voiRange, defaultVOIRange)) {
        return { ...presentation, isComputedVOI: true };
      }
    }

    return presentation;
  }

  setPresentation(props: ViewportPresentation, dataId?: string): void {
    const id = dataId ?? this.viewport.getSourceDataId?.();
    if (id) {
      this.viewport.setDisplaySetPresentation?.(id, props);
    } else {
      this.viewport.setDisplaySetPresentation?.(props);
    }
  }

  getDefaultVOIRange(dataId?: string): VOIRange | undefined {
    return this.viewport.getDefaultVOIRange?.(dataId);
  }

  getColormap(displaySetInstanceUID: string): ViewportColormap | undefined {
    return this.getPresentation(displaySetInstanceUID).colormap;
  }

  setLayerOpacity(displaySetInstanceUID: string, opacity: number): boolean {
    // Merge the opacity into the existing colormap so its name/threshold persist,
    // targeting the binding by its dataId (the bare display set UID). A uniform
    // (flat) opacity makes the slider a linear background<->foreground blend,
    // matching the flat default presentation set by the fusion hanging protocol.
    const currentColormap = this.getPresentation(displaySetInstanceUID).colormap ?? {};
    this.setPresentation({ colormap: { ...currentColormap, opacity } }, displaySetInstanceUID);
    return true;
  }

  setLayerThreshold(displaySetInstanceUID: string, threshold: number): boolean {
    // Merge the threshold into the existing colormap so its name/opacity persist.
    // The threshold is an absolute pixel/SUV value, matching the legacy volume path.
    const currentColormap = this.getPresentation(displaySetInstanceUID).colormap ?? {};
    this.setPresentation({ colormap: { ...currentColormap, threshold } }, displaySetInstanceUID);
    return true;
  }

  getOpacityGamma(): number {
    // Native volume viewports render the fusion as a volume slice whose blend is
    // linear in the opacity scalar, so the slider maps 1:1.
    return 1;
  }

  // ---- data addressing ----

  getDataIdForDisplaySet(displaySetInstanceUID: string): string | undefined {
    // Native viewports key their per-display-set presentation by the bare display
    // set UID (the dataId used by get/setDisplaySetPresentation). Returning it
    // directly keeps fusion layer reads on the intended binding instead of falling
    // back to the active source layer.
    return displaySetInstanceUID;
  }

  getVolumeIds(): string[] {
    // No legacy getAllVolumeIds surface; volume data is addressed by dataId.
    return [];
  }

  getVoxelManagerForDisplaySet(
    displaySetInstanceUID: string
  ): { getRange?: () => [number, number]; [key: string]: unknown } | undefined {
    // No getAllVolumeIds/getImageData(volumeId); resolve the display set's volume
    // from the cornerstone cache instead. Anchored match: volumeIds are built as
    // `${loaderSchema}:${displaySetInstanceUID}`, and an unanchored includes()
    // could resolve a different cached volume whose id merely embeds the same
    // UID (e.g. a derived labelmap id).
    const volume = cache
      .getVolumes()
      .find(
        v =>
          v.volumeId === displaySetInstanceUID || v.volumeId?.endsWith(`:${displaySetInstanceUID}`)
      );
    return volume?.voxelManager as unknown as
      | { getRange?: () => [number, number]; [key: string]: unknown }
      | undefined;
  }

  // ---- capture ----

  async copyDisplayedContentTo(target: CoreTypes.IViewport): Promise<void> {
    const targetViewport = target as NativeViewport;
    const viewRef = this.viewport.getViewReference?.();

    // The source's dataId is already registered in the global GenericViewport
    // metadata provider, so re-mount it on the capture viewport by id, then copy
    // per-binding presentation + view state. The native classes have no
    // setStack/setVolumes/setProperties/setViewPresentation.
    const sourceDataId = this.viewport.getSourceDataId?.();
    if (sourceDataId) {
      const { orientation } = this.getViewState();
      await targetViewport.setDisplaySets?.({
        displaySetId: sourceDataId,
        options: { orientation, role: 'source' },
      });

      const captureDataId = targetViewport.getSourceDataId?.() ?? sourceDataId;
      targetViewport.setDisplaySetPresentation?.(captureDataId, this.getPresentation(sourceDataId));
    }

    // Slice/orientation via the view reference, then pan/zoom/rotate/flip via view state.
    if (viewRef && targetViewport.setViewReference) {
      targetViewport.setViewReference(viewRef);
    }
    targetViewport.setViewState?.(this.getViewState());
  }
}
