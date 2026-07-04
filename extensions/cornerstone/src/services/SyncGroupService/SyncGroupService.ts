import { synchronizers, SynchronizerManager, Synchronizer } from '@cornerstonejs/tools';
import { getRenderingEngines, utilities } from '@cornerstonejs/core';

import { pubSubServiceInterface, Types } from '@ohif/core';
import createHydrateSegmentationSynchronizer from './createHydrateSegmentationSynchronizer';

const EVENTS = {
  TOOL_GROUP_CREATED: 'event::cornerstone::syncgroupservice:toolgroupcreated',
};

/**
 * @params options - are an optional set of options associated with the first
 * sync group declared.
 */
export type SyncCreator = (id: string, options?: Record<string, unknown>) => Synchronizer;

export type SyncGroup = {
  type: string;
  id?: string;
  // Source and target default to true if not specified
  source?: boolean;
  target?: boolean;
  options?: Record<string, unknown>;
};

const POSITION = 'cameraposition';
const VOI = 'voi';
const ZOOMPAN = 'zoompan';
const STACKIMAGE = 'stackimage';
const IMAGE_SLICE = 'imageslice';
const HYDRATE_SEG = 'hydrateseg';

const asSyncGroup = (syncGroup: string | SyncGroup): SyncGroup =>
  typeof syncGroup === 'string' ? { type: syncGroup } : syncGroup;

export default class SyncGroupService {
  static REGISTRATION = {
    name: 'syncGroupService',
    altName: 'SyncGroupService',
    create: ({ servicesManager }: Types.Extensions.ExtensionParams): SyncGroupService => {
      return new SyncGroupService(servicesManager);
    },
  };

  servicesManager: AppTypes.ServicesManager;
  listeners: { [key: string]: (...args: any[]) => void } = {};
  EVENTS: { [key: string]: string };
  synchronizerCreators: Record<string, SyncCreator> = {
    [POSITION]: synchronizers.createCameraPositionSynchronizer,
    [VOI]: synchronizers.createVOISynchronizer,
    [ZOOMPAN]: synchronizers.createZoomPanSynchronizer,
    // todo: remove stack image since it is legacy now and the image_slice
    // handles both stack and volume viewports
    [STACKIMAGE]: synchronizers.createImageSliceSynchronizer,
    [IMAGE_SLICE]: synchronizers.createImageSliceSynchronizer,
    [HYDRATE_SEG]: createHydrateSegmentationSynchronizer,
  };

  synchronizersByType: { [key: string]: Synchronizer[] } = {};

  // Ids disabled by suspendAll, so resumeAll re-enables only those and never
  // touches synchronizers that were already disabled for other reasons.
  private _suspendedSynchronizerIds = new Set<string>();

  constructor(servicesManager: AppTypes.ServicesManager) {
    this.servicesManager = servicesManager;
    this.listeners = {};
    this.EVENTS = EVENTS;
    //
    Object.assign(this, pubSubServiceInterface);
  }

  private _createSynchronizer(type: string, id: string, options): Synchronizer | undefined {
    // Initialize if not already done
    this.synchronizersByType[type] = this.synchronizersByType[type] || [];
    const syncCreator = this.synchronizerCreators[type.toLowerCase()];

    if (syncCreator) {
      // Pass the servicesManager along with other parameters
      const synchronizer = syncCreator(id, { ...options, servicesManager: this.servicesManager });

      if (synchronizer) {
        this.synchronizersByType[type].push(synchronizer);
        return synchronizer;
      }
    } else {
      console.debug(`Unknown synchronizer type: ${type}, id: ${id}`);
    }
  }

  public getSyncCreatorForType(type: string): SyncCreator {
    return this.synchronizerCreators[type.toLowerCase()];
  }

  /**
   * Creates a synchronizer type.
   * @param type is the type of the synchronizer to create
   * @param creator
   */
  public addSynchronizerType(type: string, creator: SyncCreator): void {
    this.synchronizerCreators[type.toLowerCase()] = creator;
  }

  public getSynchronizer(id: string): Synchronizer | void {
    return SynchronizerManager.getSynchronizer(id);
  }

  /**
   * Registers a custom synchronizer.
   * @param id - The id of the synchronizer.
   * @param createFunction - The function that creates the synchronizer.
   */
  public registerCustomSynchronizer(id: string, createFunction: SyncCreator): void {
    this.synchronizerCreators[id] = createFunction;
  }

  /**
   * Retrieves an array of synchronizers of a specific type.
   * @param type - The type of synchronizers to retrieve.
   * @returns An array of synchronizers of the specified type.
   */
  public getSynchronizersOfType(type: string): Synchronizer[] {
    return this.synchronizersByType[type];
  }

  protected _getOrCreateSynchronizer(
    type: string,
    id: string,
    options: Record<string, unknown>
  ): Synchronizer | undefined {
    let synchronizer = SynchronizerManager.getSynchronizer(id);

    if (!synchronizer) {
      synchronizer = this._createSynchronizer(type, id, options);
    }
    return synchronizer;
  }

  public addViewportToSyncGroup(
    viewportId: string,
    renderingEngineId: string,
    syncGroups?: SyncGroup | string | SyncGroup[] | string[]
  ): void {
    if (!syncGroups) {
      return;
    }

    const syncGroupsArray = Array.isArray(syncGroups) ? syncGroups : [syncGroups];

    syncGroupsArray.forEach(syncGroup => {
      const syncGroupObj = asSyncGroup(syncGroup);
      const { type, target = true, source = true, options = {}, id = type } = syncGroupObj;

      const synchronizer = this._getOrCreateSynchronizer(type, id, options);

      if (!synchronizer) {
        return;
      }

      synchronizer.setOptions(viewportId, options);

      const viewportInfo = { viewportId, renderingEngineId };
      if (target && source) {
        synchronizer.add(viewportInfo);
        return;
      } else if (source) {
        synchronizer.addSource(viewportInfo);
      } else if (target) {
        synchronizer.addTarget(viewportInfo);
      }
    });
  }

  /**
   * Disables every currently enabled synchronizer and records which ones this
   * call actually disabled, so resumeAll re-enables only those. Idempotent:
   * calling it again while suspended finds everything already disabled and
   * records nothing new (though it does pick up synchronizers created and
   * enabled since the previous call).
   */
  public suspendAll(): void {
    SynchronizerManager.getAllSynchronizers().forEach(synchronizer => {
      // isDisabled() also reports true for enabled synchronizers that have no
      // source elements yet, so read the enabled flag directly: those must
      // still be suspended, or they would start firing once a source mounts.
      // Guarded so a cornerstone rename of the private field degrades to the
      // public isDisabled() heuristic instead of silently suspending nothing.
      const record = synchronizer as unknown as Record<string, unknown>;
      const isEnabled =
        '_enabled' in record ? Boolean(record._enabled) : !synchronizer.isDisabled();
      if (!isEnabled) {
        return;
      }
      synchronizer.setEnabled(false);
      this._suspendedSynchronizerIds.add(synchronizer.id);
    });
  }

  /**
   * Re-enables only the synchronizers suspendAll disabled and clears the
   * record. Idempotent: with nothing recorded (never suspended, or already
   * resumed) it is a no-op.
   */
  public resumeAll(): void {
    if (!this._suspendedSynchronizerIds.size) {
      return;
    }
    SynchronizerManager.getAllSynchronizers().forEach(synchronizer => {
      if (this._suspendedSynchronizerIds.has(synchronizer.id)) {
        synchronizer.setEnabled(true);
      }
    });
    this._suspendedSynchronizerIds.clear();
  }

  public destroy(): void {
    SynchronizerManager.destroy();
  }

  public getSynchronizersForViewport(viewportId: string): Synchronizer[] {
    const renderingEngine =
      getRenderingEngines().find(re => {
        return re.getViewports().find(vp => vp.id === viewportId);
      }) || getRenderingEngines()[0];

    const synchronizers = SynchronizerManager.getAllSynchronizers();
    return synchronizers.filter(
      s =>
        s.hasSourceViewport(renderingEngine.id, viewportId) ||
        s.hasTargetViewport(renderingEngine.id, viewportId)
    );
  }

  public removeViewportFromSyncGroup(
    viewportId: string,
    renderingEngineId: string,
    syncGroupId?: string
  ): void {
    const synchronizers = SynchronizerManager.getAllSynchronizers();

    const filteredSynchronizers = syncGroupId
      ? synchronizers.filter(s => s.id === syncGroupId)
      : synchronizers;

    filteredSynchronizers.forEach(synchronizer => {
      if (!synchronizer) {
        return;
      }

      // Only image slice synchronizer register spatial registration
      if (this.isImageSliceSyncronizer(synchronizer)) {
        this.unRegisterSpatialRegistration(synchronizer);
      }

      synchronizer.remove({
        viewportId,
        renderingEngineId,
      });

      // check if any viewport is left in any of the sync groups, if not, delete that sync group
      const sourceViewports = synchronizer.getSourceViewports();
      const targetViewports = synchronizer.getTargetViewports();

      if (!sourceViewports.length && !targetViewports.length) {
        SynchronizerManager.destroySynchronizer(synchronizer.id);
      }
    });
  }
  /**
   * Clean up the spatial registration metadata created by synchronizer
   * This is needed to be able to re-sync images slices if needed
   * @param synchronizer
   */
  unRegisterSpatialRegistration(synchronizer: Synchronizer) {
    const sourceViewports = synchronizer.getSourceViewports().map(vp => vp.viewportId);
    const targetViewports = synchronizer.getTargetViewports().map(vp => vp.viewportId);

    // Create an array of pair of viewports to remove from spatialRegistrationMetadataProvider
    // All sourceViewports combined with all targetViewports
    const toUnregister = sourceViewports
      .map((sourceViewportId: string) => {
        return targetViewports.map(targetViewportId => [targetViewportId, sourceViewportId]);
      })
      .reduce((acc, c) => acc.concat(c), []);

    toUnregister.forEach(viewportIdPair => {
      utilities.spatialRegistrationMetadataProvider.add(viewportIdPair, undefined);
    });
  }
  /**
   * Check if the synchronizer type is IMAGE_SLICE
   * Need to convert to lowercase here because the types are lowercase
   * e.g: synchronizerCreators
   * @param synchronizer
   */
  isImageSliceSyncronizer(synchronizer: Synchronizer) {
    return this.getSynchronizerType(synchronizer).toLowerCase() === IMAGE_SLICE;
  }
  /**
   * Returns the syncronizer type
   * @param synchronizer
   */
  getSynchronizerType(synchronizer: Synchronizer): string {
    const synchronizerTypes = Object.keys(this.synchronizersByType);
    const syncType = synchronizerTypes.find(syncType =>
      this.getSynchronizersOfType(syncType).includes(synchronizer)
    );
    return syncType;
  }
}
