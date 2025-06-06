import type { ManagedDialogProps } from 'platform/ui-next/src/contextProviders/ManagedDialog';
type DialogOptions = ManagedDialogProps;

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
  _updatePosition: (id: string, position: { x: number; y: number }) =>
    console.warn('updatePosition() NOT IMPLEMENTED'),
  _customComponent: null,
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
   * Update the position of a specific dialog by id
   *
   * @param {string} id - The dialog id to update
   * @param {{ x: number; y: number }} position - The new position
   */
  updatePosition(id: string, position: { x: number; y: number }): void {
    return serviceImplementation._updatePosition(id, position);
  }

  /**
   * This provides flexibility in customizing the Modal's default component
   *
   * @returns {React.Component}
   */
  getCustomComponent() {
    return serviceImplementation._customComponent;
  }

  /**
   * Set the service implementation
   */
  setServiceImplementation({
    show,
    hide,
    hideAll,
    isEmpty,
    updatePosition,
    customComponent,
  }: any): void {
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
    if (updatePosition) {
      serviceImplementation._updatePosition = updatePosition;
    }
    if (customComponent) {
      serviceImplementation._customComponent = customComponent;
    }
  }
}

export default UIDialogService;
