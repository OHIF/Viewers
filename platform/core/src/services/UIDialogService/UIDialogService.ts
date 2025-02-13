import type {
  DialogContextType,
  DialogOptions,
} from '../../../../ui-next/src/contextProviders/DialogProvider';

const name = 'uiDialogService';

const serviceImplementation = {
  _show: (options: DialogOptions) => {
    console.warn('show() NOT IMPLEMENTED');
    return '';
  },
  _hide: (id: string) => console.warn('hide() NOT IMPLEMENTED'),
  _hideAll: () => console.warn('hideAll() NOT IMPLEMENTED'),
  _isEmpty: () => {
    console.warn('isEmpty() NOT IMPLEMENTED');
    return true;
  },
};

class UIDialogService {
  static REGISTRATION = {
    name,
    altName: 'UIDialogService',
    create: (): UIDialogService => {
      return new UIDialogService();
    },
  };

  readonly name = name;

  /**
   * Show a new UI dialog
   *
   * @param {DialogOptions} options - The dialog options
   * @returns {string} The dialog id
   */
  show(options: DialogOptions): string {
    return serviceImplementation._show(options);
  }

  /**
   * Hide a specific dialog by id
   *
   * @param {string} id - The dialog id to hide
   */
  hide(id: string): void {
    return serviceImplementation._hide(id);
  }

  /**
   * Hide all currently shown dialogs
   */
  hideAll(): void {
    return serviceImplementation._hideAll();
  }

  /**
   * Check if there are any dialogs currently shown
   *
   * @returns {boolean} True if no dialogs are shown
   */
  isEmpty(): boolean {
    return serviceImplementation._isEmpty();
  }

  /**
   * Set the service implementation
   */
  setServiceImplementation({ show, hide, hideAll, isEmpty }: DialogContextType): void {
    if (show) {
      serviceImplementation._show = show;
    }
    if (hide) {
      serviceImplementation._hide = hide;
    }
    if (hideAll) {
      serviceImplementation._hideAll = hideAll;
    }
    if (isEmpty) {
      serviceImplementation._isEmpty = isEmpty;
    }
  }
}

export default UIDialogService;
