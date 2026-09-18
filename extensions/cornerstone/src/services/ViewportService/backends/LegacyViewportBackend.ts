import { Enums as csEnums, Types, metaData } from '@cornerstonejs/core';
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
import type { StackViewportData, VolumeViewportData } from '../../../types/CornerstoneCacheService';
import type { IViewportBackend, StackMountContext, VolumeMountContext } from './IViewportBackend';
import type { IViewportServiceInternals } from './IViewportServiceInternals';
import { DataIdRegistry } from './dataIdRegistry';

// Mirrors WITH_ORIENTATION in CornerstoneViewportService (inlined to avoid a
// value import that would create a backend -> service circular dependency).
const WITH_ORIENTATION = { withNavigation: true, withOrientation: true };

/**
 * Legacy (default) viewport backend. Selected when `appConfig.useNextViewports`
 * is off. Routing mirrors today's CornerstoneViewportService._setDisplaySets legacy
 * branch exactly (dispatch by runtime cornerstone viewport type) and delegates the
 * per-family mount to the unchanged service methods, so the off path stays
 * byte-identical. The one legacy family that touches the GenericViewport metadata
 * provider is WSI (mountOther); those registrations go through the same
 * ref-counted registry as the native backend so they are released on viewport
 * disable/destroy instead of leaking across viewport reuse.
 */
export class LegacyViewportBackend implements IViewportBackend {
  private readonly registry = new DataIdRegistry();

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

  async mountStack(viewport: Types.IStackViewport, context: StackMountContext): Promise<void> {
    const {
      imageIds,
      initialImageIndex,
      properties,
      displayArea,
      rotation,
      flipHorizontal,
      presentations,
      overlayProcessingResults,
    } = context;

    await viewport.setStack(imageIds, initialImageIndex);
    viewport.setProperties({ ...properties });
    this.service.setPresentations(viewport.id, presentations);

    await this.service._addOverlayRepresentations(overlayProcessingResults);

    if (displayArea) {
      viewport.setDisplayArea(displayArea as Types.DisplayArea);
    }
    if (rotation) {
      viewport.setProperties({ rotation } as Parameters<typeof viewport.setProperties>[0]);
    }
    if (flipHorizontal) {
      viewport.setCamera({ flipHorizontal: true });
    }
  }

  async mountVolumes(): Promise<boolean> {
    // Legacy volumes mount through the service's shared volume tail
    // (setVolumes/addVolumes optimization, property application, presentations).
    return false;
  }

  async mountOverlayOnlyVolumes(
    viewport: Types.IViewport,
    volumeInputArray: unknown[]
  ): Promise<void> {
    await (viewport as Types.IVolumeViewport).setVolumes(volumeInputArray as Types.IVolumeInput[]);
  }

  async mountEcg(
    viewport: Types.IECGViewport,
    _displaySet: { displaySetInstanceUID: string; imageIds?: string[] },
    imageId: string
  ): Promise<void> {
    return viewport.setEcg(imageId);
  }

  async mountOther(
    viewport: Types.IViewport,
    displaySet: { displaySetInstanceUID: string; imageIds: string[] }
  ): Promise<void> {
    // CS3D's "redo viewports" replaced setDataIds with the generic
    // setDisplaySets({ displaySetId }) API; the legacy adapters key off
    // imageIds[0] as the displaySetId, so do the same here.
    const displaySetId = displaySet.imageIds[0];
    // Register the WSI dataset so the viewport can resolve its imageIds +
    // webClient by display-set id, then mount via setDisplaySets. The webClient
    // was registered under the WADO_WEB_CLIENT module (keyed by imageIds[0]) by
    // the SM SOP class handler. CS3D's "redo viewports" reads this same registry
    // (genericViewportDisplaySetMetadataProvider) from its WSI data provider;
    // without this entry setDisplaySets throws "No registered WSI dataset" and
    // the viewport renders gray.
    const webClient = metaData.get(csEnums.MetadataModules.WADO_WEB_CLIENT, displaySetId);
    // Ref-counted registration so the provider entry is removed when the last
    // viewport showing this WSI display set is disabled (or on service destroy).
    this.registry.register(viewport.id, displaySetId, {
      kind: 'wsi',
      imageIds: displaySet.imageIds,
      options: { webClient },
    });
    await (
      viewport as unknown as {
        setDisplaySets: (args: { displaySetId: string }) => Promise<void>;
      }
    ).setDisplaySets({ displaySetId });
  }

  remount(
    viewport: Types.IViewport,
    viewportData: StackViewportData | VolumeViewportData,
    viewportInfo: ViewportInfo,
    keepCamera: boolean
  ): Promise<void> | undefined {
    let displaySetPromise: Promise<void> | undefined;

    if (isVolumeViewportType(viewport)) {
      // Snapshot the camera only for the family that uses it; taking it before
      // the family checks would throw for families with no re-mount path.
      const vp = viewport as Types.IVolumeViewport;
      const viewportCamera = keepCamera ? vp.getCamera() : undefined;
      displaySetPromise = this.service
        ._setVolumeViewport(
          viewport as Types.IVolumeViewport,
          viewportData as VolumeViewportData,
          viewportInfo
        )
        .then(() => {
          if (viewportCamera) {
            vp.setCamera(viewportCamera);
            vp.render();
          }
        });
    }

    if (isStackViewportType(viewport)) {
      displaySetPromise = this.service._setStackViewport(
        viewport as Types.IStackViewport,
        viewportData as StackViewportData,
        viewportInfo
      );
    }

    return displaySetPromise;
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
    // Legacy mounts do not register dataIds through the backend interface; the
    // one provider-backed family (WSI) registers inline in mountOther.
  }

  onViewportDisabled(viewportId: string): void {
    this.registry.releaseViewport(viewportId);
  }

  destroy(): void {
    this.registry.destroy();
  }
}
