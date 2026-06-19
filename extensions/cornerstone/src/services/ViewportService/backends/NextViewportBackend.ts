import { Enums as csEnums, Types } from '@cornerstonejs/core';
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

// The PlanarViewState fields that encode pan/zoom/rotation/flip. Slice and
// orientation are deliberately EXCLUDED — they are restored via the view reference,
// and a partial setViewState patch that omits them leaves them untouched (the merge
// at PlanarViewport.setViewState preserves unspecified fields).
const NATIVE_VIEW_PRESENTATION_KEYS = [
  'displayArea',
  'anchorWorld',
  'anchorCanvas',
  'scale',
  'scaleMode',
  'rotation',
  'flipHorizontal',
  'flipVertical',
] as const;

// Minimal structural view of a native PlanarViewport's semantic accessors. These
// live on IGenericViewport (not IStackViewport/IViewport), so we cast at the boundary
// rather than import core-internal PlanarViewport/PlanarViewState types.
type NativePlanarViewport = Types.IViewport & {
  getViewState: () => Record<string, unknown>;
  setViewState: (patch: Record<string, unknown>) => void;
  getViewReference: () => Types.ViewReference;
  setViewReference: (ref: Types.ViewReference) => void;
  isReferenceViewable?: (ref: Types.ViewReference, opts?: unknown) => boolean;
};

/** Picks the pan/zoom/rotation/flip subset out of a (deep-cloned) getViewState() result. */
function pickNativeViewPresentation(
  viewState: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of NATIVE_VIEW_PRESENTATION_KEYS) {
    if (viewState[key] !== undefined) {
      out[key] = viewState[key];
    }
  }
  return out;
}

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
    // Non-planar native families (video / WSI / ECG) route by viewport TYPE to their
    // dedicated mounts: the bound data shape cannot distinguish them, and each needs
    // family-specific dataId registration. Mirrors the legacy backend's type dispatch.
    const type = (viewport as { type?: string }).type;

    if (type === csEnums.ViewportType.ECG_NEXT) {
      return this.service._setEcgViewport(
        viewport as unknown as Types.IECGViewport,
        viewportData as StackViewportData
      );
    }

    if (
      type === csEnums.ViewportType.VIDEO_NEXT ||
      type === csEnums.ViewportType.WHOLE_SLIDE_NEXT
    ) {
      return this.service._setOtherViewport(
        viewport as unknown as Types.IStackViewport,
        viewportData as StackViewportData,
        viewportInfo,
        presentations
      );
    }

    // Planar stack vs volume content both report PLANAR_NEXT, so infer from the bound
    // data shape (§4.4): volume data carries a `volume` entry, stack data does not.
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
    const is3D = isVolume3DViewportType(csViewport);
    const vp = csViewport as NativePlanarViewport;

    // A direct PLANAR_NEXT viewport has no getViewPresentation; pan/zoom/rotation/flip
    // live in the semantic view state. getViewState() is already deep-cloned, normalized
    // and JSON-serializable, so snapshot the pan/zoom subset (slice/orientation come back
    // via the view reference).
    const viewState =
      !is3D && typeof vp.getViewState === 'function' ? vp.getViewState() : undefined;

    return {
      viewportType: viewportInfo.getViewportType(),
      viewReference: is3D ? null : vp.getViewReference(),
      // Opaque native pan/zoom blob; cast at the boundary (legacy stores a Types.ViewPresentation).
      viewPresentation: (viewState
        ? pickNativeViewPresentation(viewState)
        : undefined) as unknown as Types.ViewPresentation,
      viewportId,
    };
  }

  setPositionPresentation(
    viewport: Types.IViewport,
    positionPresentation: PositionPresentation
  ): void {
    const vp = viewport as NativePlanarViewport;

    // 1) Slice + orientation first, via the view reference.
    const viewRef = positionPresentation?.viewReference;
    if (viewRef && vp.isReferenceViewable?.(viewRef, WITH_ORIENTATION)) {
      vp.setViewReference(viewRef);
    }

    // 2) Pan/zoom/rotation/flip second, as a partial setViewState patch that omits
    //    slice/orientation so step 1 is preserved (the merge keeps unspecified fields).
    const vpres = positionPresentation?.viewPresentation as unknown as
      | Record<string, unknown>
      | undefined;
    if (vpres && typeof vp.setViewState === 'function') {
      const patch: Record<string, unknown> = {};
      for (const key of NATIVE_VIEW_PRESENTATION_KEYS) {
        if (vpres[key] !== undefined) {
          patch[key] = vpres[key];
        }
      }
      if (Object.keys(patch).length > 0) {
        // When the snapshot held live anchor/scale pan/zoom, displayArea was omitted;
        // clear any stale displayArea explicitly so anchor/scale take effect (setViewState
        // only rewrites displayArea when it is an own key of the patch).
        if (!('displayArea' in patch)) {
          patch.displayArea = undefined;
        }
        vp.setViewState(patch);
      }
    }
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
