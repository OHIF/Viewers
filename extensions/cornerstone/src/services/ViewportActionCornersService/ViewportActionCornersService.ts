import { PubSubService } from '@ohif/core';
import { ViewportActionCornersLocations } from '@ohif/ui';
import { ReactNode } from 'react';

export type ActionComponentInfo = {
  viewportId: string;
  id: string;
  component: ReactNode;
  location: ViewportActionCornersLocations;
  indexPriority: number;
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
    setComponent: setComponentImplementation,
    setComponents: setComponentsImplementation,
    clear: clearImplementation,
  }): void {
    if (getStateImplementation) {
      this.serviceImplementation._getState = getStateImplementation;
    }
    if (setComponentImplementation) {
      this.serviceImplementation._setComponent = setComponentImplementation;
    }
    if (setComponentsImplementation) {
      this.serviceImplementation._setComponents = setComponentsImplementation;
    }
    if (clearImplementation) {
      this.serviceImplementation._clear = clearImplementation;
    }
  }

  public getState() {
    return this.serviceImplementation._getState();
  }

  public setComponent(component: ActionComponentInfo) {
    this.serviceImplementation._setComponent(component);
  }

  public setComponents(components: Array<ActionComponentInfo>) {
    this.serviceImplementation._setComponents(components);
  }

  public clear(viewportId: string) {
    this.serviceImplementation._clear(viewportId);
  }
}

export default ViewportActionCornersService;
