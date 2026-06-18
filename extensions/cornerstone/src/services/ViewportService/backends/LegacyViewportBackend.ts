import { Enums as csEnums, Types } from '@cornerstonejs/core';
import {
  getLegacyViewportType,
  isStackViewportType,
  isVolumeViewportType,
} from '../../../utils/getLegacyViewportType';
import type ViewportInfo from '../Viewport';
import type { Presentations } from '../../../types/Presentation';
import type {
  StackViewportData,
  VolumeViewportData,
} from '../../../types/CornerstoneCacheService';
import type { IViewportBackend } from './IViewportBackend';
import type { IViewportServiceInternals } from './IViewportServiceInternals';

/**
 * Legacy (default) viewport backend. Selected when `appConfig.useNextViewports`
 * is off. Routing mirrors today's CornerstoneViewportService._setDisplaySets legacy
 * branch exactly (dispatch by runtime cornerstone viewport type) and delegates the
 * per-family mount to the unchanged service methods, so the off path stays
 * byte-identical. The native dataId lifecycle hooks are no-ops here — legacy never
 * registers anything with the GenericViewport metadata provider.
 */
export class LegacyViewportBackend implements IViewportBackend {
  constructor(private readonly service: IViewportServiceInternals) {}

  dispatchMount(
    viewport: Types.IViewport,
    viewportData: StackViewportData | VolumeViewportData,
    viewportInfo: ViewportInfo,
    presentations: Presentations = {}
  ): Promise<void> {
    if (isStackViewportType(viewport)) {
      return this.service._setStackViewport(
        viewport as Types.IStackViewport,
        viewportData as StackViewportData,
        viewportInfo,
        presentations
      );
    }

    if (isVolumeViewportType(viewport)) {
      return this.service._setVolumeViewport(
        viewport as Types.IVolumeViewport,
        viewportData as VolumeViewportData,
        viewportInfo,
        presentations
      );
    }

    if (getLegacyViewportType(viewport) === csEnums.ViewportType.ECG) {
      return this.service._setEcgViewport(
        viewport as unknown as Types.IECGViewport,
        viewportData as StackViewportData
      );
    }

    return this.service._setOtherViewport(
      viewport as Types.IStackViewport,
      viewportData as StackViewportData,
      viewportInfo,
      presentations
    );
  }

  registerDataId(): void {
    // Legacy viewports do not use the GenericViewport metadata provider.
  }

  onViewportDisabled(): void {
    // No native registrations to release.
  }

  destroy(): void {
    // No native registrations to flush.
  }
}
