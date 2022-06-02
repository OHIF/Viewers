import { synchronizers, SynchronizerManager } from '@cornerstonejs/tools';

import { pubSubServiceInterface } from '@ohif/core';

const EVENTS = {
  TOOL_GROUP_CREATED: 'event::cornerstone::syncgroupservice:toolgroupcreated',
};

export type SyncGroup = {
  type: string;
  id: string;
  source: boolean;
  target: boolean;
};

const POSITION = 'cameraposition';
const VOI = 'voi';

export default class SyncGroupService {
  serviceManager: any;
  listeners: { [key: string]: (...args: any[]) => void } = {};
  EVENTS: { [key: string]: string };

  constructor(serviceManager) {
    this.serviceManager = serviceManager;
    this.listeners = {};
    this.EVENTS = EVENTS;
    //
    Object.assign(this, pubSubServiceInterface);
  }

  private _createSynchronizer(type: string, id: string) {
    type = type.toLowerCase();
    if (type === POSITION) {
      return synchronizers.createCameraPositionSynchronizer(id);
    } else if (type === VOI) {
      return synchronizers.createVOISynchronizer(id);
    }
  }

  public addViewportToSyncGroup(
    viewportId: string,
    renderingEngineId: string,
    syncGroups?: SyncGroup[]
  ): void {
    if (!syncGroups || !syncGroups.length) {
      return;
    }

    syncGroups.forEach(syncGroup => {
      const { type, id, target, source } = syncGroup;

      let synchronizer = SynchronizerManager.getSynchronizer(id);

      if (!synchronizer) {
        synchronizer = this._createSynchronizer(type, id);
      }

      if (target && source) {
        synchronizer.add({
          viewportId,
          renderingEngineId,
        });
        return;
      } else if (source) {
        synchronizer.addSource({
          viewportId,
          renderingEngineId,
        });
      } else if (target) {
        synchronizer.addTarget({
          viewportId,
          renderingEngineId,
        });
      }
    });
  }

  public destroy() {
    SynchronizerManager.destroy();
  }

  public removeViewportFromSyncGroup(
    viewportId: string,
    renderingEngineId: string
  ): void {
    const synchronizers = SynchronizerManager.getAllSynchronizers();

    synchronizers.forEach(synchronizer => {
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
