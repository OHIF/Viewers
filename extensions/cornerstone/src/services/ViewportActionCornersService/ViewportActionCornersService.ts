import { PubSubService } from '@ohif/core';
import { ViewportActionCornersLocations, Types } from '@ohif/ui-next';

class ViewportActionCornersService extends PubSubService {
  public static readonly EVENTS = {};
  public static readonly LOCATIONS = ViewportActionCornersLocations;

  public static REGISTRATION = {
    name: 'viewportActionCornersService',
    altName: 'ViewportActionCornersService',
    create: ({ configuration = {} }) => {
      return new ViewportActionCornersService();
    },
  };

  serviceImplementation = {};

  public LOCATIONS = ViewportActionCornersService.LOCATIONS;

  constructor() {
    super(ViewportActionCornersService.EVENTS);
    this.serviceImplementation = {};
  }

  public setServiceImplementation({
    getState: getStateImplementation,
    addComponent: addComponentImplementation,
    addComponents: addComponentsImplementation,
    clearViewport: clearViewportImplementation,
    lockItem: lockItemImplementation,
    unlockItem: unlockItemImplementation,
    toggleLock: toggleLockImplementation,
    isItemLocked: isItemLockedImplementation,
    showItem: showItemImplementation,
    hideItem: hideItemImplementation,
    toggleVisibility: toggleVisibilityImplementation,
    isItemVisible: isItemVisibleImplementation,
    openItem: openItemImplementation,
    closeItem: closeItemImplementation,
    closeAllItems: closeAllItemsImplementation,
    isItemOpen: isItemOpenImplementation,
  }): void {
    if (getStateImplementation) {
      this.serviceImplementation._getState = getStateImplementation;
    }
    if (addComponentImplementation) {
      this.serviceImplementation._addComponent = addComponentImplementation;
    }
    if (addComponentsImplementation) {
      this.serviceImplementation._addComponents = addComponentsImplementation;
    }
    if (clearViewportImplementation) {
      this.serviceImplementation._clearViewport = clearViewportImplementation;
    }
    if (lockItemImplementation) {
      this.serviceImplementation._lockItem = lockItemImplementation;
    }
    if (unlockItemImplementation) {
      this.serviceImplementation._unlockItem = unlockItemImplementation;
    }
    if (toggleLockImplementation) {
      this.serviceImplementation._toggleLock = toggleLockImplementation;
    }
    if (isItemLockedImplementation) {
      this.serviceImplementation._isItemLocked = isItemLockedImplementation;
    }
    if (showItemImplementation) {
      this.serviceImplementation._showItem = showItemImplementation;
    }
    if (hideItemImplementation) {
      this.serviceImplementation._hideItem = hideItemImplementation;
    }
    if (toggleVisibilityImplementation) {
      this.serviceImplementation._toggleVisibility = toggleVisibilityImplementation;
    }
    if (isItemVisibleImplementation) {
      this.serviceImplementation._isItemVisible = isItemVisibleImplementation;
    }
    if (openItemImplementation) {
      this.serviceImplementation._openItem = openItemImplementation;
    }
    if (closeItemImplementation) {
      this.serviceImplementation._closeItem = closeItemImplementation;
    }
    if (closeAllItemsImplementation) {
      this.serviceImplementation._closeAllItems = closeAllItemsImplementation;
    }
    if (isItemOpenImplementation) {
      this.serviceImplementation._isItemOpen = isItemOpenImplementation;
    }
  }

  public getState() {
    return this.serviceImplementation._getState();
  }

  public addComponent(component: Types.ActionComponentInfo) {
    this.serviceImplementation._addComponent(component);
  }

  public addComponents(components: Array<Types.ActionComponentInfo>) {
    this.serviceImplementation._addComponents(components);
  }

  public clearViewport(viewportId: string): void {
    this.serviceImplementation._clearViewport(viewportId);
  }

  /* lock / unlock */
  public lockItem(viewportId: string, itemId: string): void {
    this.serviceImplementation._lockItem(viewportId, itemId);
  }

  public unlockItem(viewportId: string, itemId: string): void {
    this.serviceImplementation._unlockItem(viewportId, itemId);
  }

  public toggleLock(viewportId: string, itemId: string): void {
    this.serviceImplementation._toggleLock(viewportId, itemId);
  }

  public isItemLocked(viewportId: string, itemId: string): boolean {
    return this.serviceImplementation._isItemLocked(viewportId, itemId);
  }

  /* visibility */
  public showItem(viewportId: string, itemId: string): void {
    this.serviceImplementation._showItem(viewportId, itemId);
  }

  public hideItem(viewportId: string, itemId: string): void {
    this.serviceImplementation._hideItem(viewportId, itemId);
  }

  public toggleVisibility(viewportId: string, itemId: string): void {
    this.serviceImplementation._toggleVisibility(viewportId, itemId);
  }

  public isItemVisible(viewportId: string, itemId: string): boolean {
    return this.serviceImplementation._isItemVisible(viewportId, itemId);
  }

  /* open / close */
  public openItem(viewportId: string, itemId: string): void {
    this.serviceImplementation._openItem(viewportId, itemId);
  }

  public closeItem(viewportId: string, itemId: string): void {
    this.serviceImplementation._closeItem(viewportId, itemId);
  }

  public closeAllItems(viewportId: string): void {
    this.serviceImplementation._closeAllItems(viewportId);
  }

  public isItemOpen(viewportId: string, itemId: string): boolean {
    return this.serviceImplementation._isItemOpen(viewportId, itemId);
  }

  public getAlignAndSide(location: ViewportActionCornersLocations): Types.AlignAndSide {
    switch (location) {
      case ViewportActionCornersLocations.topLeft:
        return { align: 'start', side: 'bottom' };
      case ViewportActionCornersLocations.topRight:
        return { align: 'end', side: 'bottom' };
      case ViewportActionCornersLocations.bottomLeft:
        return { align: 'start', side: 'top' };
      case ViewportActionCornersLocations.bottomRight:
        return { align: 'end', side: 'top' };
      default:
        console.debug('Unknown location, defaulting to bottom-start');
        return { align: 'start', side: 'bottom' };
    }
  }
}

export default ViewportActionCornersService;
