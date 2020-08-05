import { ToolbarButton } from '@ohif/ui';
import ToolbarDivider from './Toolbar/ToolbarDivider.jsx';
import ToolbarLayoutSelector from './Toolbar/ToolbarLayoutSelector.jsx';

export default function getToolbarModule({ commandsManager, servicesManager }) {
  const toolbarService = servicesManager.services.ToolBarService;

  return [
    {
      name: 'ohif.divider',
      defaultComponent: ToolbarDivider,
      clickHandler: () => { },
    },
    {
      name: 'ohif.action',
      defaultComponent: ToolbarButton,
      requiredConfig: [],
      optionalConfig: [],
      requiredProps: [],
      optionalProps: [],
      clickHandler: (evt, btn, btnSectionName) => {
        const { props } = btn;
        commandsManager.runCommand(props.commandName, props.commandOptions);
      },
    },
    {
      name: 'ohif.radioGroup',
      defaultComponent: ToolbarButton,
      requiredConfig: ['groupName'],
      optionalConfig: [],
      requiredProps: [],
      optionalProps: [],
      clickHandler: (evt, clickedBtn, btnSectionName, metadata, viewerProps) => {
        const { props } = clickedBtn;
        const allButtons = toolbarService.getButtons();

        // Set all buttons in same group to inactive
        Object.keys(allButtons).forEach(btnName => {
          const btn = allButtons[btnName];
          const isRadioGroupBtn =
            btn.config &&
            btn.config.groupName &&
            btn.type === 'ohif.radioGroup';

          if (
            isRadioGroupBtn &&
            clickedBtn.config.groupName === btn.config.groupName
          ) {
            btn.props.isActive = false;

            if (viewerProps.setActiveTool) {
              viewerProps.setActiveTool(props, metadata.isNested);
            }

            if (btn.props.onUnselected) {
              const { commandName, commandOptions } = btn.props.onUnselected;
              commandsManager.runCommand(commandName, commandOptions);
            }
          }
        });

        // Set our clicked button to active
        allButtons[clickedBtn.id].props.isActive = true;

        // Run button logic/command
        commandsManager.runCommand(props.commandName, props.commandOptions);

        // Set buttons & trigger notification
        toolbarService.setButtons(allButtons);
      },
    },
    {
      name: 'ohif.layoutSelector',
      defaultComponent: ToolbarLayoutSelector,
      clickHandler: (evt, clickedBtn, btnSectionName) => { },
    },
    {
      name: 'ohif.toggle',
      defaultComponent: ToolbarButton,
      requiredConfig: [],
      optionalConfig: [],
      requiredProps: [],
      optionalProps: [],
      clickHandler: (evt, clickedBtn, btnSectionName) => {
        const { props } = clickedBtn;
        const allButtons = toolbarService.getButtons();
        const thisButton = allButtons[clickedBtn.id];

        // Set our clicked button to active
        thisButton.props.isActive = !thisButton.props.isActive;

        // Run button logic/command
        // MAKE SURE THIS SUPPORTS TOGGLE!
        // commandsManager.runCommand(props.commandName, props.commandOptions);
        // What if just toggled "content"?
        // commandName OR content?

        // Set buttons & trigger notification
        toolbarService.setButtons(allButtons);
      },
    },
  ];
}
