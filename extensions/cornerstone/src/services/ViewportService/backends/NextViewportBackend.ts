import {
  Enums as csEnums,
  Types,
  metaData,
  utilities as csUtils,
  CONSTANTS as csConstants,
  isRegisteredRenderBackend,
} from '@cornerstonejs/core';
import type { RenderBackendValue } from '@cornerstonejs/core';
import { utilities as csToolsUtils } from '@cornerstonejs/tools';
import { isVolume3DViewportType } from '../../../utils/getLegacyViewportType';
import { getViewportRenderingOverride } from '../../../utils/nextViewports';
import type ViewportInfo from '../Viewport';
import type {
  Presentations,
  PositionPresentation,
  LutPresentation,
} from '../../../types/Presentation';
import type { StackViewportData, VolumeViewportData } from '../../../types/CornerstoneCacheService';
import type { IViewportBackend, StackMountContext, VolumeMountContext } from './IViewportBackend';
import type { IViewportServiceInternals } from './IViewportServiceInternals';
import { DataIdRegistry, type DataIdPayload } from './dataIdRegistry';

// Mirrors WITH_ORIENTATION in CornerstoneViewportService (inlined to avoid a
// value import that would create a backend -> service circular dependency).
const WITH_ORIENTATION = { withNavigation: true, withOrientation: true };

/**
 * Per-mount render backend override for a planar mount, resolved from the
 * `<viewportType>.viewportRendering` URL param / appConfig captured at init
 * (e.g. `?orthographic.viewportRendering=cpu`). Validated at mount time (not
 * init) because extension backends may call registerRenderBackend after the
 * cornerstone extension initializes; an unregistered value is dropped with a
 * warning rather than failing the mount.
 */
function getMountRenderBackend(viewportTypeKey: string): RenderBackendValue | undefined {
  const backend = getViewportRenderingOverride(viewportTypeKey);
  if (!backend) {
    return undefined;
  }
  if (backend !== 'auto' && !isRegisteredRenderBackend(backend)) {
    console.warn(
      `${viewportTypeKey}.viewportRendering: "${backend}" is not a registered render backend; ignoring.`
    );
    return undefined;
  }
  return backend as RenderBackendValue;
}

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
function pickNativeViewPresentation(viewState: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of NATIVE_VIEW_PRESENTATION_KEYS) {
    if (viewState[key] !== undefined) {
      out[key] = viewState[key];
    }
  }
  return out;
}

/**
 * Derives a default VOI window/level range from an image's DICOM voiLutModule
 * metadata (first WindowCenter/WindowWidth pair). Used to seed native viewport
 * windowing, which (unlike legacy StackViewport) is not auto-applied from
 * metadata. Returns undefined when the metadata has no usable window.
 */
function getDefaultVoiRangeFromMetadata(
  imageId: string
): { lower: number; upper: number } | undefined {
  if (!imageId) {
    return;
  }
  const voiLutModule = metaData.get('voiLutModule', imageId);
  const wc = Array.isArray(voiLutModule?.windowCenter)
    ? voiLutModule.windowCenter[0]
    : voiLutModule?.windowCenter;
  const ww = Array.isArray(voiLutModule?.windowWidth)
    ? voiLutModule.windowWidth[0]
    : voiLutModule?.windowWidth;
  if (wc == null || ww == null) {
    return;
  }
  return csUtils.windowLevel.toLowHighRange(ww, wc);
}

/**
 * Native GenericViewport ("next") backend. Selected when `appConfig.useNextViewports`
 * is on. Routes the mount by the bound data shape (native stack and volume content
 * both report a single PLANAR_NEXT type, so the legacy runtime-type checks cannot
 * classify them — §4.4), owns the per-family native MOUNT BODIES
 * (mountStack/mountVolumes/mountEcg/mountOther/remount), and owns the ref-counted
 * dataId lifecycle (§4.7) over cornerstone's global GenericViewport metadata
 * provider. The service's shared methods hold no native branches.
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

    // Planar stack vs volume content both report PLANAR_NEXT, so infer from the
    // persisted dataShapeType contract (§4.4) — the canonical discriminator set by
    // CornerstoneCacheService and used everywhere else. Don't probe `'volume' in
    // firstData`: that field can be lazily initialized after the data object is built,
    // so the presence check is unreliable. Fall back to the probe only when an older
    // viewportData has no dataShapeType.
    const dataShapeType = (viewportData as { dataShapeType?: csEnums.ViewportType }).dataShapeType;
    const firstData = (viewportData?.data?.[0] ?? {}) as Record<string, unknown>;
    const isVolumeContent =
      dataShapeType === csEnums.ViewportType.ORTHOGRAPHIC ||
      dataShapeType === csEnums.ViewportType.VOLUME_3D ||
      (dataShapeType === undefined && 'volume' in firstData);

    if (isVolumeContent) {
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

  /**
   * Native stack mount: register the display set and mount it with
   * setDisplaySets (render path inferred from the data), then apply
   * VOI/colormap via setDisplaySetPresentation and pan/zoom/rotate/flip/
   * displayArea via setViewState — instead of the legacy setStack/setProperties/
   * setCamera surface, which a direct PLANAR_NEXT viewport does not expose.
   */
  async mountStack(viewport: Types.IStackViewport, context: StackMountContext): Promise<void> {
    const {
      displaySetInstanceUIDs,
      imageIds,
      initialImageIndex,
      properties,
      displayArea,
      rotation,
      flipHorizontal,
      presentations,
      overlayProcessingResults,
    } = context;

    // Native stacks arrive as PLANAR_NEXT and bypass the legacy STACK-typed
    // invalid-stack guard upstream, so guard empty/malformed stack data here
    // before registering and indexing imageIds below.
    if (!imageIds?.length) {
      return;
    }

    const vp = viewport as unknown as NativePlanarViewport & {
      setDisplaySets: (args: {
        displaySetId: string;
        options: Record<string, unknown>;
      }) => Promise<void>;
      setDisplaySetPresentation: (props: Record<string, unknown>) => void;
      element: HTMLDivElement;
      id: string;
    };
    const dataId = displaySetInstanceUIDs[0];

    // Register through the ref-counted registry (§4.7) instead of the raw
    // provider.add, so the registration is released on unmount and shared
    // (MPR) registrations are not double-added or prematurely removed.
    this.registerDataId(vp.id, dataId, {
      kind: 'planar',
      imageIds,
      initialImageIdIndex: initialImageIndex,
    });

    const stackRenderBackend = getMountRenderBackend('stack');
    await vp.setDisplaySets({
      displaySetId: dataId,
      options: {
        orientation: csEnums.OrientationAxis.ACQUISITION,
        role: 'source',
        ...(stackRenderBackend ? { renderBackend: stackRenderBackend } : {}),
      },
    });

    // Native viewports are presentation-driven and do NOT auto-derive a default
    // window/level from the image's DICOM VOI metadata the way legacy StackViewport
    // does, so without this the image renders with a raw/full-range VOI (too dark).
    // When no explicit VOI is provided, seed it from the voiLutModule metadata.
    if (!properties.voiRange) {
      const defaultVoi = getDefaultVoiRangeFromMetadata(imageIds[initialImageIndex] ?? imageIds[0]);
      if (defaultVoi) {
        properties.voiRange = defaultVoi;
      }
    }

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
      vp.setDisplaySetPresentation(presentationProps);
    }

    const viewStatePatch: Record<string, unknown> = {};
    if (displayArea) {
      viewStatePatch.displayArea = displayArea;
    }
    if (rotation) {
      viewStatePatch.rotation = rotation;
    }
    if (flipHorizontal) {
      viewStatePatch.flipHorizontal = true;
    }
    if (Object.keys(viewStatePatch).length > 0) {
      vp.setViewState(viewStatePatch);
    }

    // Enable stack-context prefetch for the native path. setDisplaySets above has
    // already populated imageIds via genericViewportDisplaySetMetadataProvider, so
    // getStackData returns a valid stack at enable() time. Scroll re-prefetch is
    // driven by the native STACK_NEW_IMAGE event.
    csToolsUtils.stackContextPrefetch.enable(vp.element);

    // Restore persisted pan/zoom/rotation/flip (+ view reference) on top of the
    // HP-derived defaults applied above, so a returning display set recovers its
    // camera presentation. The LUT was already applied inline above, so restore
    // position + segmentation only. Replaying segmentationPresentation re-adds
    // hydrated representations (RTSS contour / SEG labelmap) on this native re-mount;
    // without it a hydrated overlay silently disappears (the contour-vanishes-on-
    // hydrate bug), because the overlay display set is no longer in the viewport's
    // display-set list after hydration. Native-safe: position via setViewReference/
    // setViewState, and the replayed addSegmentationRepresentation routes through the
    // native segmentation backend (no convertStackToVolumeViewport / getViewPresentation).
    if (presentations?.positionPresentation || presentations?.segmentationPresentation) {
      this.service.setPresentations(vp.id, {
        positionPresentation: presentations.positionPresentation,
        segmentationPresentation: presentations.segmentationPresentation,
      });
    }

    await this.service._addOverlayRepresentations(overlayProcessingResults);
  }

  /**
   * Native volume/MPR mount: a direct PLANAR_NEXT viewport renders a volume by
   * registering the dataset (with the already-cached volumeId) and calling
   * setDisplaySets with the requested orientation; cornerstone selects the image
   * vs reformatted-volume render path from that orientation. Returns true so the
   * service skips the legacy setVolumes/setProperties tail; an overlay-only mount
   * (no base volumes) returns false and traverses the shared tail, whose
   * legacy-surface steps are lane-guarded via mountOverlayOnlyVolumes.
   */
  async mountVolumes(viewport: Types.IViewport, context: VolumeMountContext): Promise<boolean> {
    const {
      filteredVolumeInputArray,
      volumesProperties,
      viewportInfo,
      overlayProcessingResults,
      presentations,
    } = context;

    if (!filteredVolumeInputArray.length) {
      return false;
    }

    await this._setNativeVolumeDisplaySets(
      viewport,
      filteredVolumeInputArray,
      volumesProperties,
      viewportInfo,
      overlayProcessingResults
    );

    // Restore persisted pan/zoom/rotation/flip (+ view reference) so a returning
    // MPR/volume pane recovers its camera. Also replay the stored lutPresentation so
    // user window/level, colormap, invert, opacity or threshold edits survive the
    // re-mount instead of resetting to the hanging-protocol defaults applied
    // per-binding above (applied via setDisplaySetPresentation). And replay
    // segmentationPresentation so hydrated overlays (SEG labelmap / RTSS contour)
    // reappear on this native re-mount instead of vanishing. Native-safe: position
    // via setViewReference/setViewState, segmentation via the native backend.
    if (
      presentations?.positionPresentation ||
      presentations?.lutPresentation ||
      presentations?.segmentationPresentation
    ) {
      this.service.setPresentations(viewport.id, {
        positionPresentation: presentations.positionPresentation,
        lutPresentation: presentations.lutPresentation,
        segmentationPresentation: presentations.segmentationPresentation,
      });
    }
    return true;
  }

  async mountOverlayOnlyVolumes(): Promise<void> {
    // Generic ("next") viewports don't expose the legacy setVolumes surface. A
    // native overlay-only mount adds its overlays via _addOverlayRepresentations
    // in the shared tail; there is nothing to mount here.
  }

  /**
   * Native ECG_NEXT has no setEcg; register the waveform under the display set's
   * dataId and mount it through the generic setDisplaySets API (the native ECG data
   * provider reads sourceDataId). Ref-counted via the registry (§4.7).
   */
  async mountEcg(
    viewport: Types.IECGViewport,
    displaySet: { displaySetInstanceUID: string; imageIds?: string[] },
    imageId: string
  ): Promise<void> {
    const dataId = displaySet.displaySetInstanceUID;
    this.registerDataId(viewport.id, dataId, { kind: 'ecg', sourceDataId: imageId });
    this.service._trackViewportDisplaySets(viewport.id, [dataId]);
    await (
      viewport as unknown as {
        setDisplaySets: (args: { displaySetId: string }) => Promise<void>;
      }
    ).setDisplaySets({ displaySetId: dataId });
  }

  /**
   * Native VIDEO_NEXT / WHOLE_SLIDE_NEXT: register the family-specific dataId, then
   * mount through the generic setDisplaySets API. The native video data provider
   * reads sourceDataId; the WSI provider reads imageIds + a DICOMweb client, which
   * we resolve from the WADO_WEB_CLIENT metadata exactly as the legacy WSI adapter
   * does. Ref-counted via the registry (§4.7).
   */
  async mountOther(
    viewport: Types.IViewport,
    displaySet: { displaySetInstanceUID: string; imageIds: string[] }
  ): Promise<void> {
    const dataId = displaySet.displaySetInstanceUID;
    const imageId = displaySet.imageIds[0];
    const isWsi = (viewport as { type?: string }).type === csEnums.ViewportType.WHOLE_SLIDE_NEXT;
    const payload = isWsi
      ? {
          kind: 'wsi' as const,
          imageIds: displaySet.imageIds,
          options: {
            webClient: metaData.get(csEnums.MetadataModules.WADO_WEB_CLIENT, imageId),
          },
        }
      : { kind: 'video' as const, sourceDataId: imageId };
    this.registerDataId(viewport.id, dataId, payload);
    this.service._trackViewportDisplaySets(viewport.id, [dataId]);
    await (
      viewport as unknown as {
        setDisplaySets: (args: { displaySetId: string }) => Promise<void>;
      }
    ).setDisplaySets({ displaySetId: dataId });
  }

  /**
   * Native re-mount: no getCamera/setCamera. Snapshot/restore the camera via the
   * semantic view state, and route the mount through dispatchMount (it routes by
   * data shape, since native stack and volume both report PLANAR_NEXT).
   */
  remount(
    viewport: Types.IViewport,
    viewportData: StackViewportData | VolumeViewportData,
    viewportInfo: ViewportInfo,
    keepCamera: boolean
  ): Promise<void> {
    const vp = viewport as NativePlanarViewport;
    const viewState = keepCamera ? (vp.getViewState?.() ?? {}) : undefined;
    return this.dispatchMount(viewport, viewportData, viewportInfo).then(() => {
      if (keepCamera && viewState) {
        vp.setViewState?.(viewState);
        viewport.render();
      }
    });
  }

  /**
   * Mounts one or more volumes on a native viewport for volume/MPR rendering.
   * Each base volume is registered with its already-cached volumeId and bound via
   * setDisplaySets at the viewport's requested orientation; the first base volume
   * is the source binding, any others are overlays (fusion). VOI/colormap/invert
   * are applied per-binding via setDisplaySetPresentation.
   */
  private async _setNativeVolumeDisplaySets(
    viewport: Types.IViewport,
    filteredVolumeInputArray: VolumeMountContext['filteredVolumeInputArray'],
    volumesProperties: VolumeMountContext['volumesProperties'],
    viewportInfo: ViewportInfo,
    overlayProcessingResults: VolumeMountContext['overlayProcessingResults']
  ): Promise<void> {
    const orientation = viewportInfo.getOrientation();
    // A native VOLUME_3D_NEXT viewport renders the volume as a 3D VTK volume
    // (renderMode 'vtkVolume3d'), not a reformatted planar slice; its appearance is
    // driven by a volume-rendering preset, not orientation/role.
    const is3D = (viewport as { type?: string }).type === csEnums.ViewportType.VOLUME_3D_NEXT;
    const nativeViewport = viewport as unknown as {
      setDisplaySets: (
        ...entries: Array<{ displaySetId: string; options: Record<string, unknown> }>
      ) => Promise<void>;
      setDisplaySetPresentation: (dataId: string, props: Record<string, unknown>) => void;
      getDefaultActor?: () => { actor?: unknown } | undefined;
      render: () => void;
    };
    const setDisplaySetsEntries: Array<{
      displaySetId: string;
      options: Record<string, unknown>;
    }> = [];
    const volumeRenderBackend = is3D ? undefined : getMountRenderBackend('orthographic');

    // First pass: register each dataId and build the COMPLETE entry set. The native
    // PlanarViewport.setDisplaySets has replace semantics (removeReplaceableData), so
    // it must receive ALL entries in ONE call - the first entry (role 'source')
    // resolves the source binding and the rest are overlays. Calling it once per
    // volume instead drops the previously-set source (e.g. the fusion CT): the next
    // single-entry overlay call (PT) finds no source entry, falls back to entries[0]
    // (= PT), and removeReplaceableData tears down CT - leaving only the PT colormap.
    for (const [index, { volumeInput }] of filteredVolumeInputArray.entries()) {
      const { imageIds, volumeId, displaySetInstanceUID } = volumeInput;
      const dataId = displaySetInstanceUID;

      // Ref-counted registration (§4.7): the MPR triptych shares one dataId across
      // panes, so register() adds to the provider once and release() removes only
      // when the last pane unmounts. (kind is stored but ignored by the volume3d
      // data provider, which reads imageIds/volumeId.)
      this.registerDataId(viewport.id, dataId, {
        kind: 'planar',
        imageIds,
        volumeId,
      });

      setDisplaySetsEntries.push({
        displaySetId: dataId,
        options: is3D
          ? { renderMode: 'vtkVolume3d' }
          : {
              orientation,
              role: index === 0 ? 'source' : 'overlay',
              // Volume/MPR panes are 'orthographic' viewports at the OHIF level;
              // renderBackend is a planar mount option, so the 3D branch is exempt.
              ...(volumeRenderBackend ? { renderBackend: volumeRenderBackend } : {}),
            },
      });
    }

    // Single replace call with the full entry set so the source (CT) is resolved
    // and preserved instead of being torn down by per-volume calls.
    await nativeViewport.setDisplaySets(...setDisplaySetsEntries);

    // Second pass: per-dataId presentations and the 3D preset.
    for (const [index, { volumeInput }] of filteredVolumeInputArray.entries()) {
      const dataId = volumeInput.displaySetInstanceUID;
      const props = volumesProperties[index]?.properties;
      if (props) {
        const presentationProps: Record<string, unknown> = {};
        if (props.voiRange) {
          presentationProps.voiRange = props.voiRange;
        }
        if (props.invert !== undefined) {
          presentationProps.invert = props.invert;
        }
        // colormap is a planar (LUT) concept; 3D appearance comes from the preset.
        if (props.colormap && !is3D) {
          presentationProps.colormap = props.colormap;
        }
        // Slab/blend for projection viewports (e.g. the TMTV MIP pane: blendMode
        // 'MIP' + slabThickness 'fullVolume'). The native volume-slice render path
        // maps blendMode -> reslice SlabType (MAX/MIN/MEAN) and applies the slab
        // thickness on the reslice mapper; without them the mapper renders a single
        // slice instead of a projection. 3D volume rendering derives its look from
        // the preset, not a slab, so this is planar-only. blendMode was already
        // normalized from the HP string ('MIP') to a BlendModes enum by
        // ViewportInfo.mapDisplaySetOptions, and slabThickness was resolved to a
        // number by _getSlabThickness ('fullVolume' -> volume diagonal).
        if (!is3D && volumeInput.blendMode !== undefined) {
          presentationProps.blendMode = volumeInput.blendMode;
        }
        if (!is3D && volumeInput.slabThickness !== undefined) {
          presentationProps.slabThickness = volumeInput.slabThickness;
        }
        if (Object.keys(presentationProps).length > 0) {
          nativeViewport.setDisplaySetPresentation(dataId, presentationProps);
        }
      }

      // 3D volume rendering needs an RGBA transfer function (preset) to be visible;
      // the bare native VolumeViewport3D has no setProperties, so apply the preset to
      // the volume actor directly (mirrors the legacy adapter's applyPresetToBinding).
      if (is3D && index === 0 && props?.preset) {
        const preset = csConstants.VIEWPORT_PRESETS?.find(p => p.name === props.preset);
        const actor = nativeViewport.getDefaultActor?.()?.actor;
        if (preset && actor) {
          csUtils.applyPreset(actor as Parameters<typeof csUtils.applyPreset>[0], preset);
        }
      }
    }

    // Do NOT overwrite the service's viewport display-set bookkeeping here. The
    // caller (_setVolumeViewport) already populated it with the COMPLETE set (base
    // volumes + SEG/RT/fusion overlays) before this native mount; writing back the
    // base-volume-only ids would drop the overlay UIDs from getViewportDisplaySets()
    // and the later presentation/hydration flows.

    await this.service._addOverlayRepresentations(overlayProcessingResults);
    nativeViewport.render();
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
