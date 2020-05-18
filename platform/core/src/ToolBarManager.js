export default class toolBarManager {
  constructor(extensionManager) {
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

    // TODO -> Change this to a service. => emit an event to subscribers to update the toolbar layout.
  }
}
