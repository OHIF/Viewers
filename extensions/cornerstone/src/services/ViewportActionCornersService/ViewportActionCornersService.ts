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
    setActionComponent: setActionComponentImplementation,
    setActionComponents: setActionComponentsImplementation,
    clearActionComponents: clearActionComponentsImplementation,
  }): void {
    if (getStateImplementation) {
      this.serviceImplementation._getState = getStateImplementation;
    }
    if (setActionComponentImplementation) {
      this.serviceImplementation._setActionComponent = setActionComponentImplementation;
    }
    if (setActionComponentsImplementation) {
      this.serviceImplementation._setActionComponents = setActionComponentsImplementation;
    }
    if (clearActionComponentsImplementation) {
      this.serviceImplementation._clearActionComponents = clearActionComponentsImplementation;
    }
  }

  public getState() {
    return this.serviceImplementation._getState();
  }

  public setActionComponent(component: ActionComponentInfo) {
    this.serviceImplementation._setActionComponent(component);
  }

  public setActionComponents(components: Array<ActionComponentInfo>) {
    this.serviceImplementation._setActionComponents(components);
  }

  public clearActionComponents(viewportId: string) {
    this.serviceImplementation._clearActionComponents(viewportId);
  }
}

export default ViewportActionCornersService;
