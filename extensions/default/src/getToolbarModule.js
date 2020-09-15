import { ToolbarButton } from '@ohif/ui';
import ToolbarDivider from './Toolbar/ToolbarDivider.jsx';
import ToolbarLayoutSelector from './Toolbar/ToolbarLayoutSelector.jsx';
import ToolbarSplitButton from './Toolbar/ToolbarSplitButton.jsx';

export default function getToolbarModule({ commandsManager, servicesManager }) {
  const toolbarService = servicesManager.services.ToolBarService;

  return [
    {
      name: 'ohif.divider',
      defaultComponent: ToolbarDivider,
      clickHandler: () => {},
    },
    {
      name: 'ohif.action',
      defaultComponent: ToolbarButton,
      clickHandler: () => {},
    },
    {
      name: 'ohif.radioGroup',
      defaultComponent: ToolbarButton,
      clickHandler: () => {},
    },
    {
      name: 'ohif.splitButton',
      defaultComponent: ToolbarSplitButton,
      clickHandler: () => {},
    },
    {
      name: 'ohif.layoutSelector',
      defaultComponent: ToolbarLayoutSelector,
      clickHandler: (evt, clickedBtn, btnSectionName) => {},
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
        commandsManager.runCommand(props.commandName, props.commandOptions);

        // What if just toggled "content"?
        // commandName OR content?

        // Set buttons & trigger notification
        toolbarService.setButtons(allButtons);
      },
    },
  ];
}
