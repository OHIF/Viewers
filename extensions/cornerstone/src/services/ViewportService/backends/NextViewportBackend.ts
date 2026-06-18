import { Types } from '@cornerstonejs/core';
import { isVolume3DViewportType } from '../../../utils/getLegacyViewportType';
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
import { DataIdRegistry, type DataIdPayload } from './dataIdRegistry';

// Mirrors WITH_ORIENTATION in CornerstoneViewportService (inlined to avoid a
// value import that would create a backend -> service circular dependency).
const WITH_ORIENTATION = { withNavigation: true, withOrientation: true };

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

  getPositionPresentation(
    csViewport: Types.IViewport,
    viewportInfo: ViewportInfo,
    viewportId: string
  ): PositionPresentation {
    const vp = csViewport as Types.IStackViewport;
    return {
      viewportType: viewportInfo.getViewportType(),
      viewReference: isVolume3DViewportType(csViewport) ? null : vp.getViewReference(),
      // A direct PLANAR_NEXT viewport has no getViewPresentation; its pan/zoom lives
      // in the semantic view state. Persisting/restoring that across nav/resize is a
      // later increment, so omit it here (matches the prior native behavior).
      viewPresentation: undefined,
      viewportId,
    };
  }

  setPositionPresentation(
    viewport: Types.IViewport,
    positionPresentation: PositionPresentation
  ): void {
    const vp = viewport as Types.IStackViewport;
    const viewRef = positionPresentation?.viewReference;
    if (viewRef && vp.isReferenceViewable?.(viewRef, WITH_ORIENTATION)) {
      vp.setViewReference(viewRef);
    }
    // viewPresentation (pan/zoom) is undefined on the native path for now; restoring
    // it via setViewState is a later increment.
  }

  setLutPresentation(viewport: Types.IViewport, lutPresentation: LutPresentation): void {
    if (!lutPresentation) {
      return;
    }
    const { properties } = lutPresentation;
    // Native LUT presentation is the getDisplaySetPresentation shape (voiRange/
    // colormap/invert), not a per-volumeId Map; a PLANAR_NEXT viewport applies it via
    // setDisplaySetPresentation (it has no legacy setProperties).
    if (!properties || properties instanceof Map) {
      return;
    }
    const nativeViewport = viewport as unknown as {
      setDisplaySetPresentation: (props: Record<string, unknown>) => void;
    };
    const presentationProps: Record<string, unknown> = {};
    if (properties.voiRange) {
      presentationProps.voiRange = properties.voiRange;
    }
    if (properties.invert !== undefined) {
      presentationProps.invert = properties.invert;
    }
    if (properties.colormap) {
      presentationProps.colormap = properties.colormap;
    }
    if (Object.keys(presentationProps).length > 0) {
      nativeViewport.setDisplaySetPresentation(presentationProps);
    }
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
