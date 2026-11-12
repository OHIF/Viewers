import { Enums, Types as CoreTypes } from '@cornerstonejs/core';
import {
  getLegacyViewportType,
  isOrthographicViewportType,
  isStackViewportType,
  isVolumeViewportType,
} from '../../../utils/getLegacyViewportType';
import type {
  IViewportAdapter,
  ViewportColormap,
  ViewportPresentation,
  ViewportShape,
  ViewportViewState,
  VOIRange,
} from './IViewportAdapter';

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
  getActors?: () => Array<{ referencedId?: string }>;
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
