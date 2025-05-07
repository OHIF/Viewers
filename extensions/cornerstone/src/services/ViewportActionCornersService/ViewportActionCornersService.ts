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
    clear: clearComponentsImplementation,
    setMenuDisabled: setMenuDisabledImplementation,
    isDisabled: isDisabledImplementation,
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
    if (clearComponentsImplementation) {
      this.serviceImplementation._clear = clearComponentsImplementation;
    }
    if (setMenuDisabledImplementation) {
      this.serviceImplementation._setMenuDisabled = setMenuDisabledImplementation;
    }
    if (isDisabledImplementation) {
      this.serviceImplementation._isDisabled = isDisabledImplementation;
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

  public clear(viewportId: string) {
    this.serviceImplementation._clear(viewportId);
  }

  public setMenuDisabled(viewportId: string, itemId: string, disabledStatus: boolean) {
    this.serviceImplementation._setMenuDisabled(viewportId, itemId, disabledStatus);
  }

  public isDisabled(viewportId: string, itemId: string): boolean {
    return this.serviceImplementation._isDisabled(viewportId, itemId);
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
