export default class toolBarManager {
  constructor(extensionManager, setToolBarLayout) {
    this.buttons = {};
    this.extensionManager = extensionManager;
    this.setToolBarLayout = setToolBarLayout;
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

    layouts.forEach(layout => {
      const toolBarDefinitions = [];

      layout.forEach(element => {
        if (typeof element === 'object') {
          // process submenu.

          const subMenuDefinition = { label: element.label, subMenu: [] };

          element.subMenu.forEach(subMenuElement => {
            const button = this.buttons[subMenuElement];

            subMenuDefinition.subMenu.push(button);
          });

          toolBarDefinitions.push(subMenuDefinition);
        } else {
          const button = this.buttons[element];

          toolBarDefinitions.push(button);
        }
      });

      toolBarLayout.push(toolBarDefinitions);
    });

    console.log(toolBarLayout);

    setToolBarLayout(toolBarLayout);
  }
}
