import { PubSubService } from '../_shared/pubSubServiceInterface';

class UIViewportDialogService extends PubSubService {
  public static readonly EVENTS = {};
  public static REGISTRATION = {
    name: 'uiViewportDialogService',
    altName: 'UIViewportDialogService',
    create: ({ configuration = {} }) => {
      return new UIViewportDialogService();
    },
  };

  serviceImplementation = {
    _hide: () => console.warn('hide() NOT IMPLEMENTED'),
    _show: () => console.warn('show() NOT IMPLEMENTED'),
  };

  constructor() {
    super(UIViewportDialogService.EVENTS);
    this.serviceImplementation = {
      ...this.serviceImplementation,
    };
  }

  public show({ viewportId, id, type, message, actions, onSubmit, onOutsideClick, onKeyPress }) {
    return this.serviceImplementation._show({
      viewportId,
      id,
      type,
      message,
      actions,
      onSubmit,
      onOutsideClick,
      onKeyPress,
    });
  }

  public hide() {
    return this.serviceImplementation._hide();
  }

  public setServiceImplementation({ hide: hideImplementation, show: showImplementation }) {
    if (hideImplementation) {
      this.serviceImplementation._hide = hideImplementation;
    }
    if (showImplementation) {
      this.serviceImplementation._show = showImplementation;
    }
  }
}

export default UIViewportDialogService;
