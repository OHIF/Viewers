import { Types } from '@cornerstonejs/core';
import type ViewportInfo from '../Viewport';
import type { Presentations } from '../../../types/Presentation';
import type {
  StackViewportData,
  VolumeViewportData,
} from '../../../types/CornerstoneCacheService';
import type { IViewportBackend } from './IViewportBackend';
import type { IViewportServiceInternals } from './IViewportServiceInternals';
import { DataIdRegistry, type DataIdPayload } from './dataIdRegistry';

/**
 * Native GenericViewport ("next") backend. Selected when `appConfig.useNextViewports`
 * is on. Routes the mount by the bound data shape (native stack and volume content
 * both report a single PLANAR_NEXT type, so the legacy runtime-type checks cannot
 * classify them — §4.4), and owns the ref-counted dataId lifecycle (§4.7) over
 * cornerstone's global GenericViewport metadata provider.
 *
 * For M0 the per-family mount work itself still lives in the shared service methods
 * (which carry the native branch); this backend owns the routing decision and the
 * dataId registry/GC. Relocating the native method bodies into this class is a later,
 * behavior-preserving increment.
 */
export class NextViewportBackend implements IViewportBackend {
  private readonly registry = new DataIdRegistry();

  constructor(private readonly service: IViewportServiceInternals) {}

  dispatchMount(
    viewport: Types.IViewport,
    viewportData: StackViewportData | VolumeViewportData,
    viewportInfo: ViewportInfo,
    presentations: Presentations = {}
  ): Promise<void> {
    const firstData = (viewportData?.data?.[0] ?? {}) as Record<string, unknown>;

    if ('volume' in firstData) {
      return this.service._setVolumeViewport(
        viewport as unknown as Types.IVolumeViewport,
        viewportData as VolumeViewportData,
        viewportInfo,
        presentations
      );
    }

    return this.service._setStackViewport(
      viewport as unknown as Types.IStackViewport,
      viewportData as StackViewportData,
      viewportInfo,
      presentations
    );
  }

  registerDataId(viewportId: string, dataId: string, payload: DataIdPayload): void {
    this.registry.register(viewportId, dataId, payload);
  }

  onViewportDisabled(viewportId: string): void {
    this.registry.releaseViewport(viewportId);
  }

  destroy(): void {
    this.registry.destroy();
  }
}
