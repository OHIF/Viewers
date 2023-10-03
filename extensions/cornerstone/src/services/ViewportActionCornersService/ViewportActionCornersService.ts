import { PubSubService } from '@ohif/core';

export const VIEWPORT_ACTION_ARROWS_COMPONENT_ID = 'viewportActionArrowsComponent';
export const VIEWPORT_STATUS_COMPONENT_ID = 'viewportStatusComponent';

class ViewportActionCornersService extends PubSubService {
  public static readonly EVENTS = {};

  public static REGISTRATION = {
    name: 'viewportActionCornersService',
    altName: 'ViewportActionCornersService',
    create: ({ configuration = {} }) => {
      return new ViewportActionCornersService();
    },
  };

  serviceImplementation = {};

  constructor() {
    super(ViewportActionCornersService.EVENTS);
    this.serviceImplementation = {};
  }

  public setServiceImplementation({
    getState: getStateImplementation,
    setActionComponent: setActionComponentImplementation,
  }): void {
    if (getStateImplementation) {
      this.serviceImplementation._getState = getStateImplementation;
    }
    if (setActionComponentImplementation) {
      this.serviceImplementation._setActionComponent = setActionComponentImplementation;
    }
  }

  public getState() {
    return this.serviceImplementation._getState();
  }

  public setActionComponent(props) {
    this.serviceImplementation._setActionComponent(props);
  }
}

export default ViewportActionCornersService;
