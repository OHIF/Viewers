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
    const buttonSectionIds = this.buttonSections[key];
    const buttonsInSection = [];

    if (!buttonSectionIds) {
      return buttonsInSection;
    }

    buttonSectionIds.forEach(btnIdOrArray => {
      const isNested = Array.isArray(btnIdOrArray);

      if (isNested) {
        const btnIds = btnIdOrArray;
        const nestedButtons = [];

        btnIds.forEach(nestedBtnId => {
          const nestedBtn = this.buttons[nestedBtnId];
          const mappedNestedBtn = this._mapButtonToDisplay(nestedBtn, key);

          nestedButtons.push(mappedNestedBtn);
        });

        if (nestedButtons.length) {
          buttonsInSection.push(nestedButtons);
        }
      } else {
        const btnId = btnIdOrArray;
        const btn = this.buttons[btnId];
        const mappedBtn = this._mapButtonToDisplay(btn, key);

        buttonsInSection.push(mappedBtn);
      }
    });

    return buttonsInSection;
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

  /**
   *
   * @param {*} btn
   * @param {*} btnSection
   */
  _mapButtonToDisplay(btn, btnSection) {
    const { id, type, component, props } = btn;
    const buttonType = this._buttonTypes()[type];

    if (!buttonType) {
      return;
    }

    const onClick = evt => {
      if (buttonType.clickHandler) {
        buttonType.clickHandler(evt, btn, btnSection);
      }
      if (btn.props.onClick) {
        btn.onClick(evt, btn, btnSection);
      }
      if (btn.props.clickHandler) {
        btn.clickHandler(evt, btn, btnSection);
      }

      this._trySetButtonActive(id);
    };

    return {
      id,
      Component: component || buttonType.defaultComponent,
      componentProps: Object.assign({}, props, { onClick }), //
    };
  }
}
