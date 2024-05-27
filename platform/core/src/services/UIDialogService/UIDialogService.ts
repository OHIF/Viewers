import { PubSubService } from '../_shared/pubSubServiceInterface';

class UIDialogService extends PubSubService {
  public static readonly EVENTS = {};

  public static REGISTRATION = {
    name: 'uiDialogService',
    altName: 'UIDialogService',
    create: ({ configuration = {} }) => {
      return new UIDialogService();
    },
  };

  serviceImplementation = {
    _dismiss: () => console.warn('dismiss() NOT IMPLEMENTED'),
    _dismissAll: () => console.warn('dismissAll() NOT IMPLEMENTED'),
    _create: () => console.warn('create() NOT IMPLEMENTED'),
  };

  constructor() {
    super(UIDialogService.EVENTS);
    this.serviceImplementation = {
      ...this.serviceImplementation,
    };
  }

  public create({
    id,
    content,
    contentProps,
    onStart,
    onDrag,
    onStop,
    centralize = false,
    preservePosition = true,
    isDraggable = true,
    showOverlay = false,
    defaultPosition,
  }) {
    return this.serviceImplementation._create({
      id,
      content,
      contentProps,
      onStart,
      onDrag,
      onStop,
      centralize,
      preservePosition,
      isDraggable,
      showOverlay,
      defaultPosition,
    });
  }

  public dismiss({ id }) {
    return this.serviceImplementation._dismiss({ id });
  }

  public dismissAll() {
    return this.serviceImplementation._dismissAll();
  }

  public setServiceImplementation({
    dismiss: dismissImplementation,
    dismissAll: dismissAllImplementation,
    create: createImplementation,
  }) {
    if (dismissImplementation) {
      this.serviceImplementation._dismiss = dismissImplementation;
    }
    if (dismissAllImplementation) {
      this.serviceImplementation._dismissAll = dismissAllImplementation;
    }
    if (createImplementation) {
      this.serviceImplementation._create = createImplementation;
    }
  }
}

export default UIDialogService;
