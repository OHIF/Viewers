import { PubSubService } from '@ohif/core';

export type ViewedDataPayload = {
  viewedDataId?: string;
  viewedDataCleared?: boolean;
};

class ViewedDataService extends PubSubService {
  public static readonly EVENTS = {
    VIEWED_DATA_CHANGED: 'event::viewedDataChanged',
  };

  public static REGISTRATION = {
    name: 'viewedDataService',
    altName: 'ViewedDataService',
    create: () => {
      return new ViewedDataService();
    },
  };

  private viewedDataIds = new Set<string>();

  constructor() {
    super(ViewedDataService.EVENTS);
  }

  public markDataViewed(dataId: string): void {
    if (!dataId || this.viewedDataIds.has(dataId)) {
      return;
    }

    this.viewedDataIds.add(dataId);
    this._broadcastEvent(this.EVENTS.VIEWED_DATA_CHANGED, {
      viewedDataId: dataId,
    });
  }

  public isDataViewed(dataId: string): boolean {
    if (!dataId) {
      return false;
    }

    return this.viewedDataIds.has(dataId);
  }

  public clearViewedData(): void {
    this.viewedDataIds.clear();
    this._broadcastEvent(this.EVENTS.VIEWED_DATA_CHANGED, {
      viewedDataCleared: true,
    });
  }

  public subscribeViewedDataChanges(listener: (payload: ViewedDataPayload) => void) {
    return this.subscribe(this.EVENTS.VIEWED_DATA_CHANGED, listener);
  }
}

export default ViewedDataService;
