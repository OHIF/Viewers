import { PubSubService } from '@ohif/core';
import { ViewportActionCornersLocations } from '@ohif/ui-next';
import { ReactNode } from 'react';

export type ActionComponentInfo = {
  viewportId: string;
  id: string;
  component: ReactNode;
  location: ViewportActionCornersLocations;
  indexPriority?: number;
};

export type AlignAndSide = {
  align: 'start' | 'end' | 'center';
  side: 'top' | 'bottom' | 'left' | 'right';
};

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
  }

  public getState() {
    return this.serviceImplementation._getState();
  }

  public addComponent(component: ActionComponentInfo) {
    this.serviceImplementation._addComponent(component);
  }

  public addComponents(components: Array<ActionComponentInfo>) {
    this.serviceImplementation._addComponents(components);
  }

  public clear(viewportId: string) {
    this.serviceImplementation._clear(viewportId);
  }

  public getAlignAndSide(location: ViewportActionCornersLocations): AlignAndSide {
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
