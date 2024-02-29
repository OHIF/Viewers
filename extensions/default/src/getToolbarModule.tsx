import ToolbarDivider from './Toolbar/ToolbarDivider';
import ToolbarLayoutSelectorWithServices from './Toolbar/ToolbarLayoutSelector';
import ToolbarSplitButtonWithServices from './Toolbar/ToolbarSplitButtonWithServices';
import { ToolbarButton } from '@ohif/ui';

export default function getToolbarModule({ commandsManager, servicesManager }) {
  const { toolbarService } = servicesManager.services;
  return [
    {
      name: 'ohif.action',
      defaultComponent: ToolbarButton,
    },
    {
      name: 'ohif.radioGroup',
      defaultComponent: ToolbarButton,
    },
    {
      name: 'ohif.toggle',
      defaultComponent: ToolbarButton,
    },
    {
      name: 'ohif.divider',
      defaultComponent: ToolbarDivider,
    },
    {
      name: 'ohif.splitButton',
      defaultComponent: ToolbarSplitButtonWithServices,
    },
    {
      name: 'ohif.layoutSelector',
      defaultComponent: ToolbarLayoutSelectorWithServices,
    },
    {
      name: 'evaluate.systemToggle',
      evaluate: ({ button, interaction }) => {
        const { id } = button;

        const cineGetSet = toolbarService.getStateManagementFunctions(id);
        const isToggled = cineGetSet.get();

        if (!interaction) {
          // means we are just queuing the state
          return {
            className: isToggled
              ? 'text-primary-active'
              : 'text-common-bright hover:!bg-primary-dark hover:text-primary-light',
          };
        }

        // means we are actually toggling the state with interaction
        const newState = !isToggled;
        cineGetSet.set(newState);
        return {
          className: newState
            ? 'text-primary-active'
            : 'text-common-bright hover:!bg-primary-dark hover:text-primary-light',
        };
      },
    },
  ];
}
