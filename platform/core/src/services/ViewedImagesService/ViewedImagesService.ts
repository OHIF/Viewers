import { PubSubService } from '../_shared/pubSubServiceInterface';

export type ViewedImagePayload = {
  viewedImageId?: string;
  viewedImagesCleared?: boolean;
};

class ViewedImagesService extends PubSubService {
  public static readonly EVENTS = {
    VIEWED_IMAGES_CHANGED: 'event::viewedImagesChanged',
  };

  public static REGISTRATION = {
    name: 'viewedImagesService',
    altName: 'ViewedImagesService',
    create: () => {
      return new ViewedImagesService();
    },
  };

  private viewedImageIds = new Set<string>();

  constructor() {
    super(ViewedImagesService.EVENTS);
  }

  public markImageViewed(imageId: string): void {
    if (!imageId || this.viewedImageIds.has(imageId)) {
      return;
    }

    this.viewedImageIds.add(imageId);
    this._broadcastEvent(this.EVENTS.VIEWED_IMAGES_CHANGED, {
      viewedImageId: imageId,
    });
  }

  public isImageViewed(imageId: string): boolean {
    if (!imageId) {
      return false;
    }

    return this.viewedImageIds.has(imageId);
  }

  public clearViewedImages(): void {
    this.viewedImageIds.clear();
    this._broadcastEvent(this.EVENTS.VIEWED_IMAGES_CHANGED, {
      viewedImagesCleared: true,
    });
  }

  public subscribeViewedImageChanges(listener: (payload: ViewedImagePayload) => void) {
    return this.subscribe(this.EVENTS.VIEWED_IMAGES_CHANGED, listener);
  }
}

export default ViewedImagesService;
