import { Enums, Types as CoreTypes, cache, getShouldUseCPURendering } from '@cornerstonejs/core';
import {
  getLegacyViewportType,
  isOrthographicViewportType,
  isStackViewportType,
  isVolume3DViewportType,
  isVolumeViewportType,
} from '../../../utils/getLegacyViewportType';
import {
  blendOpFromEngine,
  blendOpToEngine,
  getVolumeDiagonal,
} from '../../../projection/projectionRegistry';
import { MIN_SLAB_THICKNESS } from '../../../projection/projectionConstants';
import type {
  IViewportAdapter,
  ProjectionState,
  ProjectionSupport,
  ProjectionWriteResult,
  SlabRange,
  ViewportColormap,
  ViewportPresentation,
  ViewportShape,
  ViewportViewState,
  VOIRange,
} from './IViewportAdapter';

/** Legacy volume viewport actor entry fields the projection path relies on. */
type LegacyActorEntry = {
  uid?: string;
  referencedId?: string;
  slabThickness?: number;
  blendMode?: unknown;
};

/**
 * Structural view of the legacy StackViewport/VolumeViewport surface used by
 * the adapter. Optional-chained because different legacy families expose
 * different subsets (e.g. only volume viewports have getAllVolumeIds).
 * Deliberately NOT an intersection with CoreTypes.IViewport: the adapter
 * contract types these members with the next-shaped signatures (e.g. getCamera
 * as a plain record), and IViewport's own declarations would win otherwise.
 */
type LegacyViewport = {
  getProperties?: (dataId?: string) => ViewportPresentation | undefined;
  setProperties?: (props: ViewportPresentation, dataId?: string) => void;
  getCamera?: () => Record<string, unknown> | undefined;
  setCamera?: (patch: Record<string, unknown>) => void;
  getAllVolumeIds?: () => string[];
  getImageData?: (volumeId?: string) => {
    imageData?: { get: (key: string) => { voxelManager?: unknown } | undefined };
  };
  getActors?: () => LegacyActorEntry[];
  getVolumeId?: () => string | undefined;
  getBlendMode?: (filterActorUIDs?: string[]) => unknown;
  setBlendMode?: (blendMode: unknown, filterActorUIDs?: string[], immediate?: boolean) => void;
  setSlabThickness?: (slabThickness: number, filterActorUIDs?: string[]) => void;
  resetSlabThickness?: () => void;
  isInAcquisitionPlane?: () => boolean;
  getViewReference?: () => CoreTypes.ViewReference | undefined;
  setViewReference?: (ref: CoreTypes.ViewReference) => void;
  getViewPresentation?: () => unknown;
  setViewPresentation?: (presentation: unknown) => void;
  getCurrentImageId?: () => string;
  setStack?: (imageIds: string[]) => Promise<unknown>;
  setVolumes?: (volumes: Array<{ volumeId: string }>) => Promise<unknown>;
};

/**
 * Opacity slider gamma the legacy fusion rendering expects: the slider value is
 * applied through a 1/5 curve (native renders a linear blend and uses gamma 1).
 */
export const LEGACY_OPACITY_GAMMA = 1 / 5;

/**
 * Legacy lane of IViewportAdapter — adapts the StackViewport/VolumeViewport
 * surface (getCamera/getProperties/volumeIds) to the next-shaped contract.
 * Deleting the legacy path deletes this file. Instantiated only by
 * `getViewportAdapter`.
 */
export class LegacyViewportAdapter implements IViewportAdapter {
  constructor(private readonly viewport: LegacyViewport) {}

  // ---- classification ----

  getShape(): ViewportShape {
    switch (getLegacyViewportType(this.viewport)) {
      case Enums.ViewportType.STACK:
        return 'stack';
      case Enums.ViewportType.ORTHOGRAPHIC:
        return 'volume';
      case Enums.ViewportType.VOLUME_3D:
        return 'volume3d';
      default:
        return 'unknown';
    }
  }

  isVolumeRendering(): boolean {
    return isOrthographicViewportType(this.viewport);
  }

  canReorientInPlace(): boolean {
    return isOrthographicViewportType(this.viewport);
  }

  isInAcquisitionPlane(): boolean {
    return !!this.viewport.isInAcquisitionPlane?.();
  }

  hasContent(): boolean {
    const actorEntries = this.viewport.getActors?.();
    return !!actorEntries && actorEntries.length > 0;
  }

  // ---- view geometry ----

  getViewState(): ViewportViewState {
    return this.viewport.getCamera?.() ?? {};
  }

  setViewState(patch: ViewportViewState): void {
    this.viewport.setCamera?.(patch);
  }

  getViewPlaneNormal(): CoreTypes.Point3 | undefined {
    return this.viewport.getCamera?.()?.viewPlaneNormal as CoreTypes.Point3 | undefined;
  }

  getFocalPoint(): CoreTypes.Point3 | undefined {
    return this.viewport.getCamera?.()?.focalPoint as CoreTypes.Point3 | undefined;
  }

  // ---- per-display-set appearance ----

  getPresentation(dataId?: string): ViewportPresentation {
    return (dataId ? this.viewport.getProperties?.(dataId) : this.viewport.getProperties?.()) ?? {};
  }

  setPresentation(props: ViewportPresentation, dataId?: string): void {
    this.viewport.setProperties?.(props, dataId);
  }

  getDefaultVOIRange(): VOIRange | undefined {
    // Legacy getProperties always returns the applied VOI; there is no separate
    // computed-default accessor.
    return undefined;
  }

  getColormap(displaySetInstanceUID: string): ViewportColormap | undefined {
    if (isStackViewportType(this.viewport)) {
      return this.viewport.getProperties?.()?.colormap;
    }

    const actorEntries = this.viewport.getActors?.();
    const actorEntry = actorEntries?.find(entry =>
      entry.referencedId?.includes(displaySetInstanceUID)
    );
    if (!actorEntry) {
      return undefined;
    }
    return this.viewport.getProperties?.(actorEntry.referencedId)?.colormap;
  }

  setLayerOpacity(displaySetInstanceUID: string, opacity: number): boolean {
    if (!isVolumeViewportType(this.viewport)) {
      return false;
    }
    const volumeId = this.getDataIdForDisplaySet(displaySetInstanceUID);
    if (!volumeId) {
      return false;
    }

    // Merge the opacity into the current colormap so its name/threshold persist.
    const currentColormap = this.viewport.getProperties?.(volumeId)?.colormap ?? {};
    this.viewport.setProperties?.({ colormap: { ...currentColormap, opacity } }, volumeId);
    return true;
  }

  setLayerThreshold(displaySetInstanceUID: string, threshold: number): boolean {
    if (!isVolumeViewportType(this.viewport)) {
      return false;
    }
    const volumeId = this.getDataIdForDisplaySet(displaySetInstanceUID);
    if (!volumeId) {
      return false;
    }

    this.viewport.setProperties?.({ colormap: { threshold } }, volumeId);
    return true;
  }

  getOpacityGamma(): number {
    return LEGACY_OPACITY_GAMMA;
  }

  // ---- data addressing ----

  getDataIdForDisplaySet(displaySetInstanceUID: string): string | undefined {
    // Multi-volume viewports address a layer by the volumeId that embeds the
    // display set UID; single-actor viewports (stack) address the active layer
    // implicitly (undefined).
    if (typeof this.viewport.getAllVolumeIds !== 'function') {
      return undefined;
    }
    const volumeIds = this.viewport.getAllVolumeIds() || [];
    return volumeIds.length > 0
      ? (volumeIds.find(id => id.includes(displaySetInstanceUID)) ?? undefined)
      : undefined;
  }

  getVolumeIds(): string[] {
    if (typeof this.viewport.getAllVolumeIds !== 'function') {
      return [];
    }
    return this.viewport.getAllVolumeIds() || [];
  }

  getVoxelManagerForDisplaySet(
    displaySetInstanceUID: string
  ): { getRange?: () => [number, number]; [key: string]: unknown } | undefined {
    if (!isVolumeViewportType(this.viewport)) {
      return undefined;
    }
    const volumeId = this.getDataIdForDisplaySet(displaySetInstanceUID);
    if (!volumeId) {
      return undefined;
    }
    const imageData = this.viewport.getImageData?.(volumeId);
    return imageData?.imageData?.get('voxelManager')?.voxelManager as
      | { getRange?: () => [number, number]; [key: string]: unknown }
      | undefined;
  }

  // ---- projection ----
  //
  // Legacy VolumeViewport realises a slab as two mapper clipping planes placed at
  // focal +/- slabThickness (cornerstone Viewport.setOrientationOfClippingPlanes),
  // so the engine value is HALF the user-facing total width. Both engine writers
  // (setBlendMode / setSlabThickness) treat an empty filter as "every actor";
  // this adapter therefore always resolves the layer to the actor uid whose
  // referencedId is the layer's volumeId and refuses when it cannot.

  private resolveProjectionLayer(
    displaySetInstanceUID?: string
  ): { volumeId: string; actorUID: string; entry: LegacyActorEntry } | undefined {
    if (!isOrthographicViewportType(this.viewport)) {
      return undefined;
    }
    const volumeId = displaySetInstanceUID
      ? this.getDataIdForDisplaySet(displaySetInstanceUID)
      : (this.viewport.getVolumeId?.() ?? this.getVolumeIds()[0]);
    if (!volumeId) {
      return undefined;
    }
    const entry = this.viewport.getActors?.()?.find(e => e.referencedId === volumeId);
    if (!entry?.uid) {
      return undefined;
    }
    return { volumeId, actorUID: entry.uid, entry };
  }

  supportsProjection(displaySetInstanceUID?: string): ProjectionSupport {
    if (isVolume3DViewportType(this.viewport)) {
      return { supported: false, reason: 'volume3d' };
    }
    if (!isOrthographicViewportType(this.viewport)) {
      return { supported: false, reason: 'not-volume' };
    }
    // A legacy VolumeViewport cannot be constructed under CPU rendering; kept as
    // an explicit refusal rather than an assumption.
    if (getShouldUseCPURendering?.()) {
      return { supported: false, reason: 'cpu-lane' };
    }
    const layer = this.resolveProjectionLayer(displaySetInstanceUID);
    if (!layer) {
      return { supported: false, reason: 'layer-unresolved' };
    }
    const volume = cache.getVolume(layer.volumeId);
    // Streaming volumes carry loadStatus; a volume without one is complete by
    // construction (same rule cornerstone applies when creating slice actors).
    const loaded = !!volume && (!volume.loadStatus || volume.loadStatus.loaded === true);
    if (!loaded) {
      return { supported: false, reason: 'volume-not-loaded' };
    }
    return { supported: true };
  }

  getProjection(displaySetInstanceUID?: string): ProjectionState | undefined {
    const layer = this.resolveProjectionLayer(displaySetInstanceUID);
    if (!layer) {
      return undefined;
    }
    const blendOp = blendOpFromEngine(this.viewport.getBlendMode?.([layer.actorUID]));
    if (blendOp === undefined) {
      // An engine blend the registry does not offer (e.g. labelmap edge projection).
      return undefined;
    }
    const engineHalfWidth = layer.entry.slabThickness ?? 0;
    const slabThickness = engineHalfWidth > MIN_SLAB_THICKNESS ? engineHalfWidth * 2 : 0;
    return { blendOp, slabThickness };
  }

  setProjection(
    projection: ProjectionState,
    displaySetInstanceUID?: string
  ): ProjectionWriteResult {
    const layer = this.resolveProjectionLayer(displaySetInstanceUID);
    if (!layer) {
      return { applied: false, rendered: false };
    }
    const filter = [layer.actorUID];

    if (projection.blendOp === 'none') {
      this.viewport.setBlendMode?.(blendOpToEngine('none'), filter);
      // Explicit reset, never "thickness = 0" (the engine clamps that up to the
      // minimum and leaves the clipping planes in place). resetSlabThickness is
      // viewport-wide, so it is only used when no other layer still projects.
      const othersProject = (this.viewport.getActors?.() ?? []).some(
        e => e.uid !== layer.actorUID && (e.slabThickness ?? 0) > MIN_SLAB_THICKNESS
      );
      if (othersProject) {
        this.viewport.setSlabThickness?.(MIN_SLAB_THICKNESS, filter);
      } else {
        this.viewport.resetSlabThickness?.();
      }
      return { applied: true, rendered: false };
    }

    this.viewport.setBlendMode?.(blendOpToEngine(projection.blendOp), filter);
    this.viewport.setSlabThickness?.(projection.slabThickness / 2, filter);
    return { applied: true, rendered: false };
  }

  getSlabRange(displaySetInstanceUID?: string): SlabRange | undefined {
    const layer = this.resolveProjectionLayer(displaySetInstanceUID);
    const volume = layer ? cache.getVolume(layer.volumeId) : undefined;
    if (!volume) {
      return undefined;
    }
    return { min: MIN_SLAB_THICKNESS, max: getVolumeDiagonal(volume) };
  }

  // ---- capture ----

  async copyDisplayedContentTo(target: CoreTypes.IViewport): Promise<void> {
    const targetViewport = target as unknown as LegacyViewport;
    const viewRef = this.viewport.getViewReference?.();

    // - properties: VOI, colormap, interpolation, etc.
    // - viewPresentation: flip/rotate/zoom presentation state (preserves flip/rotate)
    const properties = this.viewport.getProperties?.();
    const viewPresentation = this.viewport.getViewPresentation?.();

    if (isStackViewportType(targetViewport)) {
      const imageId = this.viewport.getCurrentImageId?.();
      await targetViewport.setStack?.([imageId]);
    } else if (isVolumeViewportType(targetViewport)) {
      const volumeIds = this.getVolumeIds();
      await targetViewport.setVolumes?.([{ volumeId: volumeIds[0] }]);
    }

    if (viewPresentation && targetViewport.setViewPresentation) {
      targetViewport.setViewPresentation(viewPresentation);
    }

    targetViewport.setProperties?.(properties);

    if (viewRef && targetViewport.setViewReference) {
      targetViewport.setViewReference(viewRef);
    }
  }
}
