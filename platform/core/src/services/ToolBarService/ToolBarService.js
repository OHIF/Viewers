import pubSubServiceInterface from '../pubSubServiceInterface';

const EVENTS = {
  TOOL_BAR_MODIFIED: 'event::toolBarService:toolBarModified',
};

export default class ToolBarService {
  constructor() {
    this.displaySets = {};
    this.EVENTS = EVENTS;
    this.listeners = {};

    Object.assign(this, pubSubServiceInterface);
  }

  init(extensionManager) {
    this.buttons = {};
    this.extensionManager = extensionManager;
  }

  addButtons(buttons) {
    buttons.forEach(button => {
      const buttonDefinition = this.extensionManager.getModuleEntry(
        button.namespace
      );

      const id = button.id || buttonDefinition.id;

      this.buttons[id] = buttonDefinition;
    });
  }

  /**
   * Broadcasts displaySetService changes.
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

  setToolBarLayout(layouts) {
    const toolBarLayout = [];

    layouts.forEach(layout => {
      const toolBarDefinitions = { tools: [], moreTools: [] };

      const { tools, moreTools } = layout;

      tools &&
        tools.forEach(element => {
          const button = this.buttons[element];

          toolBarDefinitions.tools.push(button);
        });

      moreTools &&
        moreTools.forEach(element => {
          const button = this.buttons[element];

          toolBarDefinitions.moreTools.push(button);
        });

      toolBarLayout.push(toolBarDefinitions);
    });

    this.toolBarLayout = toolBarLayout;

    this._broadcastChange(this.EVENTS.TOOL_BAR_MODIFIED, toolBarLayout);
  }
}
