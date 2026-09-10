import { PubSubService, Types as OhifTypes } from '@ohif/core';
import { Enums as csEnums, Types as csTypes, cache, eventTarget } from '@cornerstonejs/core';
import { getViewportAdapter } from '../ViewportService/adapter';
import type {
  ProjectionState,
  ProjectionSupport,
  ProjectionUnsupportedReason,
  SlabRange,
} from '../ViewportService/adapter';
import { DEFAULT_SLAB_THICKNESS } from '../../projection/projectionConstants';
import {
  getProjectionMode,
  fromEngine,
  type ProjectionModeId,
} from '../../projection/projectionRegistry';

export type ProjectionRefusalReason =
  | 'no-viewport'
  | 'no-layer'
  | '3d-viewport'
  | 'not-reconstructable'
  | 'promotion-failed'
  | 'write-refused'
  | ProjectionUnsupportedReason;

export type ProjectionServiceResult =
  | { applied: true; projection: ProjectionState }
  | { applied: false; reason: ProjectionRefusalReason; message: string };

export interface ProjectionTarget {
  viewportId?: string;
  /** Layer (display set) to project; defaults to the foreground layer rule. */
  displaySetInstanceUID?: string;
}

export interface SetProjectionModeArgs extends ProjectionTarget {
  modeId: ProjectionModeId;
  /** Total slab width (mm). Defaults to the stored value, then DEFAULT_SLAB_THICKNESS. */
  slabThickness?: number;
}

export interface SetSlabThicknessArgs extends ProjectionTarget {
  slabThickness: number;
}

export interface ProjectionSnapshot extends ProjectionTarget {
  viewportId: string;
  displaySetInstanceUID: string;
  /** Engine read-back; undefined when the layer cannot be resolved or holds a foreign blend. */
  projection: ProjectionState | undefined;
  /** Registry mode id derived from the read-back (undefined when foreign). */
  modeId: ProjectionModeId | undefined;
  support: ProjectionSupport;
  slabRange: SlabRange | undefined;
  /**
   * True when the viewport is a 2D stack on reconstructable data: the engine
   * cannot project it yet, but enabling projection promotes it to a volume
   * viewport first, so the UI must still offer the switch.
   */
  promotionAvailable: boolean;
}

interface StoredProjection {
  modeId: ProjectionModeId;
  slabThickness: number;
}

const REFUSAL_MESSAGES: Record<ProjectionRefusalReason, string> = {
  'no-viewport': 'No viewport is available for projection.',
  'no-layer': 'The viewport has no display set to project.',
  '3d-viewport': 'Projection is not available on 3D volume rendering viewports.',
  'not-reconstructable': 'The display set is not reconstructable into a volume.',
  'promotion-failed': 'The viewport could not be converted to a volume viewport.',
  'write-refused': 'The rendering engine refused the projection write.',
  'not-volume': 'Projection needs a volume viewport.',
  volume3d: 'Projection is not available on 3D volume rendering viewports.',
  'cpu-lane': 'Projection is not available with CPU rendering.',
  'layer-unresolved': 'The layer could not be resolved in the rendering engine.',
  'volume-not-loaded': 'The volume is still loading; projection needs the full volume.',
};

const VOLUME_LOAD_TIMEOUT_MS = 120_000;
const PROMOTION_TIMEOUT_MS = 30_000;

/**
 * Owns projection (MIP / MinIP / AIP) for OHIF viewports.
 *
 * Responsibilities: guards (target exists, is not a 3D view, data is
 * reconstructable and fully loaded), promotion of a 2D stack viewport to a
 * volume viewport (snapshot rotation/flip, replay once), exactly one render per
 * engine write, per-layer persistence across viewport rebuilds, and a
 * PROJECTION_CHANGED broadcast whose payload is READ BACK from the engine.
 *
 * It never remembers "MIP is on": the truth is `getProjection`, which asks the
 * viewport adapter. The stored map is only a restore cache.
 */
export default class ProjectionService extends PubSubService {
  static EVENTS = {
    PROJECTION_CHANGED: 'event::projectionService:projectionChanged',
  };

  public static REGISTRATION = {
    name: 'projectionService',
    create: ({ servicesManager, commandsManager }: OhifTypes.Extensions.ExtensionParams) => {
      return new ProjectionService(servicesManager, commandsManager);
    },
  };

  private readonly servicesManager: AppTypes.ServicesManager;
  private readonly commandsManager: AppTypes.CommandsManager;
  private readonly stored = new Map<string, Map<string, StoredProjection>>();
  private subscriptions: Array<() => void> | undefined;

  constructor(
    servicesManager: AppTypes.ServicesManager,
    commandsManager: AppTypes.CommandsManager
  ) {
    super(ProjectionService.EVENTS);
    this.servicesManager = servicesManager;
    this.commandsManager = commandsManager;
  }

  // ---- public API (the two entry points plus read-back) ----

  public async setProjectionMode(args: SetProjectionModeArgs): Promise<ProjectionServiceResult> {
    this.ensureSubscriptions();
    const mode = getProjectionMode(args.modeId);
    const viewportId = this.resolveViewportId(args.viewportId);
    if (!viewportId) {
      return this.refuse('no-viewport');
    }
    let viewport = this.getViewport(viewportId);
    if (!viewport) {
      return this.refuse('no-viewport');
    }
    const displaySetInstanceUID = this.resolveLayer(viewportId, args.displaySetInstanceUID);
    if (!displaySetInstanceUID) {
      return this.refuse('no-layer');
    }

    const adapter = getViewportAdapter(viewport);
    if (adapter.getShape() === 'volume3d') {
      return this.refuse('3d-viewport');
    }

    // Turning off on a viewport that never projected is a no-op that still
    // reports the engine state (a stack viewport has nothing to reset).
    if (!mode.requiresSlab && adapter.getShape() !== 'volume') {
      this.forget(viewportId, displaySetInstanceUID);
      return { applied: true, projection: { blendOp: 'none', slabThickness: 0 } };
    }

    const { displaySetService } = this.servicesManager.services;
    const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
    if (mode.requiresSlab && !displaySet?.isReconstructable) {
      return this.refuse('not-reconstructable');
    }

    if (mode.requiresSlab && adapter.getShape() === 'stack') {
      const promoted = await this.promoteToVolume(viewportId, viewport);
      if (!promoted) {
        return this.refuse('promotion-failed');
      }
      viewport = promoted;
    }

    if (mode.requiresSlab) {
      await this.waitForVolumeLoaded(displaySetInstanceUID);
    }

    const liveAdapter = getViewportAdapter(viewport);
    const support = liveAdapter.supportsProjection(displaySetInstanceUID);
    if (!support.supported) {
      return this.refuse(support.reason);
    }

    const write: ProjectionState = mode.requiresSlab
      ? {
          blendOp: mode.blendOp,
          slabThickness: this.clampSlab(
            args.slabThickness ??
              this.getStored(viewportId, displaySetInstanceUID)?.slabThickness ??
              DEFAULT_SLAB_THICKNESS,
            liveAdapter.getSlabRange(displaySetInstanceUID)
          ),
        }
      : { blendOp: 'none', slabThickness: 0 };

    const result = this.write(viewport, displaySetInstanceUID, write);
    if (!result.applied) {
      return this.refuse('write-refused');
    }

    if (mode.requiresSlab) {
      this.remember(viewportId, displaySetInstanceUID, {
        modeId: mode.id,
        slabThickness: write.slabThickness,
      });
    } else {
      this.forget(viewportId, displaySetInstanceUID);
    }

    const projection = this.broadcast(viewportId, displaySetInstanceUID);
    return { applied: true, projection: projection ?? write };
  }

  /**
   * Reads the current mode from the engine and restates it with the new
   * thickness. When no projection is active the thickness is only stored as
   * the preferred value for the next enable.
   */
  public async setSlabThickness(args: SetSlabThicknessArgs): Promise<ProjectionServiceResult> {
    this.ensureSubscriptions();
    const viewportId = this.resolveViewportId(args.viewportId);
    const viewport = viewportId ? this.getViewport(viewportId) : undefined;
    if (!viewportId || !viewport) {
      return this.refuse('no-viewport');
    }
    const displaySetInstanceUID = this.resolveLayer(viewportId, args.displaySetInstanceUID);
    if (!displaySetInstanceUID) {
      return this.refuse('no-layer');
    }
    const adapter = getViewportAdapter(viewport);
    const current = adapter.getProjection(displaySetInstanceUID);
    const currentModeId = current ? this.modeIdForBlendOp(current.blendOp) : undefined;

    if (!current || !currentModeId || current.blendOp === 'none') {
      const stored = this.getStored(viewportId, displaySetInstanceUID);
      this.remember(viewportId, displaySetInstanceUID, {
        modeId: stored?.modeId ?? 'mip',
        slabThickness: this.clampSlab(
          args.slabThickness,
          adapter.getSlabRange(displaySetInstanceUID)
        ),
      });
      // Nothing projects, so do not wake the engine; only a stored preference changed.
      const projection = this.broadcast(viewportId, displaySetInstanceUID);
      return { applied: true, projection: projection ?? { blendOp: 'none', slabThickness: 0 } };
    }

    return this.setProjectionMode({
      viewportId,
      displaySetInstanceUID,
      modeId: currentModeId,
      slabThickness: args.slabThickness,
    });
  }

  /** Engine read-back for a layer (never the stored value). */
  public getProjection(target: ProjectionTarget = {}): ProjectionState | undefined {
    return this.snapshot(target)?.projection;
  }

  public supportsProjection(target: ProjectionTarget = {}): ProjectionSupport {
    const snapshot = this.snapshot(target);
    return snapshot?.support ?? { supported: false, reason: 'not-volume' };
  }

  public getSlabRange(target: ProjectionTarget = {}): SlabRange | undefined {
    return this.snapshot(target)?.slabRange;
  }

  /** Stored (preferred) thickness for a layer, used by the UI while projection is off. */
  public getStoredSlabThickness(target: ProjectionTarget = {}): number | undefined {
    const viewportId = this.resolveViewportId(target.viewportId);
    if (!viewportId) {
      return undefined;
    }
    const layer = this.resolveLayer(viewportId, target.displaySetInstanceUID);
    return layer ? this.getStored(viewportId, layer)?.slabThickness : undefined;
  }

  /** Everything the UI needs, derived from the engine in one read. */
  public snapshot(target: ProjectionTarget = {}): ProjectionSnapshot | undefined {
    this.ensureSubscriptions();
    const viewportId = this.resolveViewportId(target.viewportId);
    const viewport = viewportId ? this.getViewport(viewportId) : undefined;
    if (!viewportId || !viewport) {
      return undefined;
    }
    const displaySetInstanceUID = this.resolveLayer(viewportId, target.displaySetInstanceUID);
    if (!displaySetInstanceUID) {
      return undefined;
    }
    const adapter = getViewportAdapter(viewport);
    const projection = adapter.getProjection(displaySetInstanceUID);
    const { displaySetService } = this.servicesManager.services;
    const promotionAvailable =
      adapter.getShape() === 'stack' &&
      !!displaySetService.getDisplaySetByUID(displaySetInstanceUID)?.isReconstructable;
    return {
      viewportId,
      displaySetInstanceUID,
      projection,
      modeId: projection ? this.modeIdForBlendOp(projection.blendOp) : undefined,
      support: adapter.supportsProjection(displaySetInstanceUID),
      slabRange: adapter.getSlabRange(displaySetInstanceUID),
      promotionAvailable,
    };
  }

  public destroy(): void {
    this.subscriptions?.forEach(unsubscribe => unsubscribe());
    this.subscriptions = undefined;
    this.stored.clear();
  }

  // ---- internals ----

  private refuse(reason: ProjectionRefusalReason): ProjectionServiceResult {
    return { applied: false, reason, message: REFUSAL_MESSAGES[reason] };
  }

  private getViewport(viewportId: string): csTypes.IViewport | undefined {
    const { cornerstoneViewportService } = this.servicesManager.services;
    return cornerstoneViewportService.getCornerstoneViewport(viewportId) ?? undefined;
  }

  private resolveViewportId(viewportId?: string): string | undefined {
    if (viewportId) {
      return viewportId;
    }
    const { viewportGridService } = this.servicesManager.services;
    return viewportGridService.getActiveViewportId() ?? undefined;
  }

  /**
   * The layer to project: an explicit display set (must be in the viewport),
   * else the foreground layer the opacity/threshold controls operate on (the
   * last non-overlay display set in a fusion, else the first display set).
   */
  private resolveLayer(viewportId: string, displaySetInstanceUID?: string): string | undefined {
    const { viewportGridService, displaySetService } = this.servicesManager.services;
    const uids: string[] = viewportGridService.getDisplaySetsUIDsForViewport(viewportId) ?? [];
    if (displaySetInstanceUID) {
      return uids.includes(displaySetInstanceUID) ? displaySetInstanceUID : undefined;
    }
    const nonOverlay = uids.filter(uid => {
      const displaySet = displaySetService.getDisplaySetByUID(uid);
      return displaySet && !displaySet.isOverlayDisplaySet;
    });
    if (nonOverlay.length === 0) {
      return undefined;
    }
    return nonOverlay.length > 1 ? nonOverlay[nonOverlay.length - 1] : nonOverlay[0];
  }

  private modeIdForBlendOp(blendOp: ProjectionState['blendOp']): ProjectionModeId | undefined {
    // Route through the registry so this never becomes a second translation table.
    switch (blendOp) {
      case 'none':
        return 'none';
      case 'max':
        return fromEngine(csEnums.BlendModes.MAXIMUM_INTENSITY_BLEND);
      case 'min':
        return fromEngine(csEnums.BlendModes.MINIMUM_INTENSITY_BLEND);
      case 'mean':
        return fromEngine(csEnums.BlendModes.AVERAGE_INTENSITY_BLEND);
      default:
        return undefined;
    }
  }

  private clampSlab(value: number, range: SlabRange | undefined): number {
    if (!Number.isFinite(value)) {
      return DEFAULT_SLAB_THICKNESS;
    }
    if (!range) {
      return Math.max(value, 0);
    }
    return Math.min(Math.max(value, range.min), range.max);
  }

  private getStored(viewportId: string, layer: string): StoredProjection | undefined {
    return this.stored.get(viewportId)?.get(layer);
  }

  private remember(viewportId: string, layer: string, value: StoredProjection): void {
    if (!this.stored.has(viewportId)) {
      this.stored.set(viewportId, new Map());
    }
    this.stored.get(viewportId).set(layer, value);
  }

  private forget(viewportId: string, layer: string): void {
    this.stored.get(viewportId)?.delete(layer);
  }

  /**
   * The single engine write path: writes blend and slab together through the
   * adapter and renders exactly once.
   */
  private write(
    viewport: csTypes.IViewport,
    layer: string,
    projection: ProjectionState
  ): { applied: boolean } {
    const adapter = getViewportAdapter(viewport);
    const result = adapter.setProjection(projection, layer);
    if (result.applied && !result.rendered) {
      viewport.render();
    }
    return { applied: result.applied };
  }

  private broadcast(
    viewportId: string,
    displaySetInstanceUID: string
  ): ProjectionState | undefined {
    const viewport = this.getViewport(viewportId);
    const adapter = viewport ? getViewportAdapter(viewport) : undefined;
    const projection = adapter?.getProjection(displaySetInstanceUID);
    this._broadcastEvent(ProjectionService.EVENTS.PROJECTION_CHANGED, {
      viewportId,
      displaySetInstanceUID,
      projection,
      support: adapter?.supportsProjection(displaySetInstanceUID),
    });
    const { toolbarService } = this.servicesManager.services;
    toolbarService?.refreshToolbarState?.({ viewportId });
    return projection;
  }

  /**
   * Converts a 2D stack viewport into a volume (MPR-capable) viewport in place,
   * preserving the display-set options and replaying rotation/flip once.
   */
  private async promoteToVolume(
    viewportId: string,
    viewport: csTypes.IViewport
  ): Promise<csTypes.IViewport | undefined> {
    const { viewportGridService, cornerstoneViewportService } = this.servicesManager.services;
    const adapter = getViewportAdapter(viewport);
    const viewState = adapter.getViewState() ?? {};
    const replay: Record<string, unknown> = {};
    for (const key of ['rotation', 'flipHorizontal', 'flipVertical']) {
      if (viewState[key] !== undefined) {
        replay[key] = viewState[key];
      }
    }
    // The slice the user was looking at: a re-mount would otherwise land on the
    // volume's initial slice. Replayed through the view reference, gated the
    // same way the legacy backend gates a position-presentation restore.
    const viewReference = (
      viewport as csTypes.IViewport & { getViewReference?: () => csTypes.ViewReference }
    ).getViewReference?.();

    const gridViewport = viewportGridService.getState().viewports.get(viewportId);
    const displaySetInstanceUIDs: string[] = gridViewport?.displaySetInstanceUIDs ?? [];
    if (!displaySetInstanceUIDs.length) {
      return undefined;
    }
    const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportId);
    const orientation = viewportInfo?.getOrientation?.() ?? csEnums.OrientationAxis.ACQUISITION;
    const displaySetOptions =
      gridViewport?.displaySetOptions?.length === displaySetInstanceUIDs.length
        ? gridViewport.displaySetOptions
        : displaySetInstanceUIDs.map(() => ({}));

    const remounted = this.waitForVolumesChanged(viewportId);
    this.commandsManager.run('setDisplaySetsForViewports', {
      viewportsToUpdate: [
        {
          viewportId,
          displaySetInstanceUIDs,
          viewportOptions: {
            viewportType: csEnums.ViewportType.ORTHOGRAPHIC,
            orientation,
          },
          displaySetOptions,
        },
      ],
    });
    const ok = await remounted;
    if (!ok) {
      return undefined;
    }
    const promoted = this.getViewport(viewportId);
    if (!promoted) {
      return undefined;
    }
    const navigable = promoted as csTypes.IViewport & {
      isReferenceViewable?: (ref: csTypes.ViewReference, options?: unknown) => boolean;
      setViewReference?: (ref: csTypes.ViewReference) => void;
    };
    if (
      viewReference &&
      navigable.isReferenceViewable?.(viewReference, {
        withNavigation: true,
        withOrientation: true,
      })
    ) {
      navigable.setViewReference?.(viewReference);
    }
    if (Object.keys(replay).length) {
      getViewportAdapter(promoted).setViewState(replay);
    }
    return promoted;
  }

  private waitForVolumesChanged(viewportId: string): Promise<boolean> {
    const { cornerstoneViewportService } = this.servicesManager.services;
    return new Promise(resolve => {
      const timer = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, PROMOTION_TIMEOUT_MS);
      const { unsubscribe } = cornerstoneViewportService.subscribe(
        cornerstoneViewportService.EVENTS.VIEWPORT_VOLUMES_CHANGED,
        ({ viewportInfo }) => {
          if (viewportInfo?.getViewportId?.() !== viewportId) {
            return;
          }
          clearTimeout(timer);
          unsubscribe();
          resolve(true);
        }
      );
    });
  }

  private findVolume(displaySetInstanceUID: string) {
    return cache
      .getVolumes()
      .find(
        v =>
          v.volumeId === displaySetInstanceUID || v.volumeId?.endsWith(`:${displaySetInstanceUID}`)
      );
  }

  /** Resolves once the layer's volume reports loadStatus.loaded (or is complete by construction). */
  private waitForVolumeLoaded(displaySetInstanceUID: string): Promise<void> {
    const isLoaded = () => {
      const volume = this.findVolume(displaySetInstanceUID);
      return !!volume && (!volume.loadStatus || volume.loadStatus.loaded === true);
    };
    if (isLoaded()) {
      return Promise.resolve();
    }
    return new Promise(resolve => {
      const done = () => {
        clearTimeout(timer);
        eventTarget.removeEventListener(csEnums.Events.IMAGE_VOLUME_LOADING_COMPLETED, onLoaded);
        resolve();
      };
      const onLoaded = (evt: CustomEvent) => {
        const volumeId: string | undefined = evt?.detail?.volumeId;
        if (
          volumeId === displaySetInstanceUID ||
          volumeId?.endsWith(`:${displaySetInstanceUID}`) ||
          isLoaded()
        ) {
          done();
        }
      };
      const timer = setTimeout(done, VOLUME_LOAD_TIMEOUT_MS);
      eventTarget.addEventListener(csEnums.Events.IMAGE_VOLUME_LOADING_COMPLETED, onLoaded);
    });
  }

  /**
   * Restore and housekeeping. Subscribed lazily so the service works no matter
   * the registration order of the cornerstone services.
   */
  private ensureSubscriptions(): void {
    if (this.subscriptions) {
      return;
    }
    const { cornerstoneViewportService } = this.servicesManager.services;
    if (!cornerstoneViewportService) {
      return;
    }
    this.subscriptions = [];

    // Re-apply stored projections after a volume (re)mount. This runs after the
    // mount has applied VOI/colormap/LUT presentations (slab is stripped from the
    // LUT capture), so nothing later in the mount can overwrite blend/slab.
    this.subscriptions.push(
      cornerstoneViewportService.subscribe(
        cornerstoneViewportService.EVENTS.VIEWPORT_VOLUMES_CHANGED,
        ({ viewportInfo }) => {
          const viewportId = viewportInfo?.getViewportId?.();
          if (viewportId) {
            this.restore(viewportId);
          }
        }
      ).unsubscribe
    );

    // Drop stored entries for layers that left the viewport.
    this.subscriptions.push(
      cornerstoneViewportService.subscribe(
        cornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED,
        ({ viewportId }) => {
          if (!viewportId) {
            return;
          }
          const { viewportGridService } = this.servicesManager.services;
          const uids: string[] =
            viewportGridService.getDisplaySetsUIDsForViewport(viewportId) ?? [];
          for (const layer of Array.from(this.stored.get(viewportId)?.keys() ?? [])) {
            if (!uids.includes(layer)) {
              this.forget(viewportId, layer);
            }
          }
        }
      ).unsubscribe
    );

    // Volume completion changes enablement; announce it with a fresh read-back.
    const onVolumeLoaded = (evt: CustomEvent) => {
      const volumeId: string | undefined = evt?.detail?.volumeId;
      if (!volumeId) {
        return;
      }
      const { viewportGridService } = this.servicesManager.services;
      const state = viewportGridService.getState();
      state.viewports.forEach((gridViewport, viewportId) => {
        const uids: string[] = gridViewport?.displaySetInstanceUIDs ?? [];
        const layer = uids.find(uid => volumeId === uid || volumeId.endsWith(`:${uid}`));
        if (layer && this.getViewport(viewportId)) {
          this.broadcast(viewportId, layer);
        }
      });
    };
    eventTarget.addEventListener(csEnums.Events.IMAGE_VOLUME_LOADING_COMPLETED, onVolumeLoaded);
    this.subscriptions.push(() =>
      eventTarget.removeEventListener(csEnums.Events.IMAGE_VOLUME_LOADING_COMPLETED, onVolumeLoaded)
    );
  }

  private restore(viewportId: string): void {
    const layers = this.stored.get(viewportId);
    if (!layers?.size) {
      return;
    }
    const viewport = this.getViewport(viewportId);
    if (!viewport) {
      return;
    }
    const adapter = getViewportAdapter(viewport);
    let rendered = false;
    layers.forEach((stored, layer) => {
      const support = adapter.supportsProjection(layer);
      if (!support.supported) {
        return;
      }
      const mode = getProjectionMode(stored.modeId);
      const result = adapter.setProjection(
        {
          blendOp: mode.blendOp,
          slabThickness: this.clampSlab(stored.slabThickness, adapter.getSlabRange(layer)),
        },
        layer
      );
      if (result.applied && !result.rendered) {
        rendered = true;
      }
    });
    if (rendered) {
      viewport.render();
    }
    layers.forEach((_stored, layer) => this.broadcast(viewportId, layer));
  }
}
