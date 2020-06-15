import pubSubServiceInterface from '../_shared/pubSubServiceInterface';

const EVENTS = {
  TOOL_BAR_MODIFIED: 'event::toolBarService:toolBarModified',
};

export default class ToolBarService {
  constructor() {
    this.EVENTS = EVENTS;
    this.listeners = {};
    this.buttons = {};
    this.buttonSections = {
      /**
       * primary: ['Zoom', 'Wwwc'],
       * secondary: ['Length', 'RectangleRoi']
       */
    };

    Object.assign(this, pubSubServiceInterface);
  }

  init(extensionManager) {
    this.extensionManager = extensionManager;
  }

  getButtons() {
    return this.buttons;
  }

  setButtons(buttons) {
    this.buttons = buttons;
    this._broadcastChange(this.EVENTS.TOOL_BAR_MODIFIED, {});
  }

  _buttonTypes() {
    console.log(this.extensionManager.modules);
    const buttonTypes = {};
    const registeredToolbarModules = this.extensionManager.modules[
      'toolbarModule'
    ];

    if (
      Array.isArray(registeredToolbarModules) &&
      registeredToolbarModules.length
    ) {
      registeredToolbarModules.forEach(toolbarModule =>
        toolbarModule.module.forEach(def => {
          buttonTypes[def.name] = def;
        })
      );
    }

    return buttonTypes;
  }


  createButtonSection(key, buttons) {
    // Maybe do this mapping at time of return, instead of time of create
    // Props check important for validation here...

    this.buttonSections[key] = buttons;
    this._broadcastChange(this.EVENTS.TOOL_BAR_MODIFIED, {});
  }

  getButtonSection(key) {
    const buttonSection = this.buttonSections[key];
    const buttonsInSection = [];

    if (!buttonSection) {
      return buttonsInSection;
    }

    buttonSection.forEach(btnId => {
      const button = this.buttons[btnId];
      if (button) {
        buttonsInSection.push(button);
      } else {
        console.warn(`${btnId} is not a registered button.`);
      }
    });

    const mappedButtonSection = buttonsInSection.map(bt => {
      const { id, type, component, props } = bt;
      const buttonType = this._buttonTypes()[type];

      // Filter out & warn
      if (!buttonType) {
        return;
      }

      const onClick = evt => {
        console.warn(
          `Handling click for: BTN::${id}`,
          evt,
          bt,
          buttonType,
          btnSection
        );
        const btnSection = key;
        if (buttonType.clickHandler) {
          buttonType.clickHandler(evt, bt, btnSection);
        }
        if (bt.props.onClick) {
          bt.onClick(evt, bt, btnSection);
        }
        if (bt.props.clickHandler) {
          bt.clickHandler(evt, bt, btnSection);
        }

        this._trySetButtonActive(id);
      };

      return {
        id,
        Component: component || buttonType.defaultComponent,
        componentProps: Object.assign({}, props, { onClick }), //
      };
    });

    return mappedButtonSection;
  }

  /**
   *
   * @param {object[]} buttons
   * @param {string} buttons[].id
   */
  addButtons(buttons) {
    buttons.forEach(button => {
      if (!this.buttons[button.id]) {
        this.buttons[button.id] = button;
      }
    });

    this._broadcastChange(this.EVENTS.TOOL_BAR_MODIFIED, {});
  }
  }

  /**
   * Broadcasts toolbarService changes.
   *
   * @param {string} eventName The event name
   * @return void
   */
  _broadcastChange = (eventName, callbackProps) => {
    const hasListeners = Object.keys(this.listeners).length > 0;
    const hasCallbacks = Array.isArray(this.listeners[eventName]);

    if (hasListeners && hasCallbacks) {
      this.listeners[eventName].forEach(listener => {
        listener.callback(callbackProps);
      });
    }
  };
}
