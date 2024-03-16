import { synchronizers, SynchronizerManager, Synchronizer } from '@cornerstonejs/tools';

import { pubSubServiceInterface, Types, ServicesManager } from '@ohif/core';

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

  servicesManager: ServicesManager;
  listeners: { [key: string]: (...args: any[]) => void } = {};
  EVENTS: { [key: string]: string };
  synchronizerCreators: Record<string, SyncCreator> = {
    [POSITION]: synchronizers.createCameraPositionSynchronizer,
    [VOI]: synchronizers.createVOISynchronizer,
    [ZOOMPAN]: synchronizers.createZoomPanSynchronizer,
    [STACKIMAGE]: synchronizers.createImageSliceSynchronizer,
  };

  constructor(serviceManager: ServicesManager) {
    this.servicesManager = serviceManager;
    this.listeners = {};
    this.EVENTS = EVENTS;
    //
    Object.assign(this, pubSubServiceInterface);
  }

  private _createSynchronizer(type: string, id: string, options): Synchronizer | undefined {
    const syncCreator = this.synchronizerCreators[type.toLowerCase()];
    if (syncCreator) {
      return syncCreator(id, options);
    } else {
      console.warn('Unknown synchronizer type', type, id);
    }
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

  public destroy(): void {
    SynchronizerManager.destroy();
  }

  public getSynchronizersForViewport(
    viewportId: string,
    renderingEngineId: string
  ): Synchronizer[] {
    return SynchronizerManager.getAllSynchronizers().filter(
      s =>
        s.hasSourceViewport(renderingEngineId, viewportId) ||
        s.hasTargetViewport(renderingEngineId, viewportId)
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
}
