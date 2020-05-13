export default class toolBarManager {
  constructor(extensionManager, setToolBarLayout) {
    this.buttons = {};
    this.extensionManager = extensionManager;
    this.viewModelContextSetToolBarLayout = setToolBarLayout;
  }

  addButtons(buttons) {
    buttons.forEach(button => {
      const buttonDefinition = this.extensionManager.getModuleEntry(
        button.namespace
      );

      const id = button.id || buttonDefinition.id;

      this.buttons[id] = buttonDefinition;
    });

    console.log(this.buttons);
  }

  setToolBarLayout(layouts) {
    const toolBarLayout = [];

    debugger;
    console.log('setToolBarLayout');

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

    console.log(`TOOLBAR LAYOUT`);
    console.log(toolBarLayout);

    this.viewModelContextSetToolBarLayout(toolBarLayout);
  }
}
