import { Enums as csEnums, Types } from '@cornerstonejs/core';
import {
  getLegacyViewportType,
  isStackViewportType,
  isVolume3DViewportType,
  isVolumeViewportType,
} from '../../../utils/getLegacyViewportType';
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
import type { IViewportBackend } from './IViewportBackend';
import type { IViewportServiceInternals } from './IViewportServiceInternals';

// Mirrors WITH_ORIENTATION in CornerstoneViewportService (inlined to avoid a
// value import that would create a backend -> service circular dependency).
const WITH_ORIENTATION = { withNavigation: true, withOrientation: true };

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

  getPositionPresentation(
    csViewport: Types.IViewport,
    viewportInfo: ViewportInfo,
    viewportId: string
  ): PositionPresentation {
    const vp = csViewport as Types.IStackViewport;
    return {
      viewportType: viewportInfo.getViewportType(),
      viewReference: isVolume3DViewportType(csViewport) ? null : vp.getViewReference(),
      viewPresentation: vp.getViewPresentation({ pan: true, zoom: true }),
      viewportId,
    };
  }

  setPositionPresentation(
    viewport: Types.IViewport,
    positionPresentation: PositionPresentation
  ): void {
    const vp = viewport as Types.IStackViewport | Types.IVolumeViewport;
    const viewRef = positionPresentation?.viewReference;
    if (viewRef) {
      // The orientation can be updated here to navigate to the specified
      // measurement or previous item, but this will not switch to volume
      // or to stack from the other type
      if (vp.isReferenceViewable(viewRef, WITH_ORIENTATION)) {
        vp.setViewReference(viewRef);
      } else {
        console.warn('Unable to apply reference viewable', viewRef);
      }
    }

    const viewPresentation = positionPresentation?.viewPresentation;
    if (viewPresentation) {
      vp.setViewPresentation(viewPresentation);
    }
  }

  setLutPresentation(viewport: Types.IViewport, lutPresentation: LutPresentation): void {
    if (!lutPresentation) {
      return;
    }

    const vp = viewport as Types.IStackViewport | Types.IVolumeViewport;
    const { properties } = lutPresentation;
    if (isVolumeViewportType(vp)) {
      if (properties instanceof Map) {
        properties.forEach((propertiesEntry, volumeId) => {
          (vp as Types.IVolumeViewport).setProperties(propertiesEntry, volumeId);
        });
      } else {
        vp.setProperties(properties);
      }
    } else {
      vp.setProperties(properties);
    }
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
