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
      name: 'evaluate.group.promoteToPrimary',
      evaluate: ({ viewportId, button, itemId }) => {
        const { items } = button.props;

        if (!itemId) {
          return {
            primary: button.props.primary,
            items,
          };
        }

        // other wise we can move the clicked tool to the primary button
        const clickedItemProps = items.find(item => item.id === itemId || item.itemId === itemId);

        return {
          primary: clickedItemProps,
          items,
        };
      },
    },
    {
      name: 'evaluate.systemToggle',
      evaluate: ({ button, interaction }) => {
        const { id } = button;

        const cineGetSet = toolbarService.getStateManagementFunctions(id);
        const isToggled = cineGetSet.get();

        const getClassName = isToggled => {
          return {
            className: isToggled
              ? 'text-primary-active'
              : 'text-common-bright hover:!bg-primary-dark hover:text-primary-light',
          };
        };
        if (!interaction) {
          // means we are just queuing the state
          return getClassName(isToggled);
        }

        const { itemId } = interaction;

        if (id !== itemId) {
          // means we are just queuing and interaction was on another
          // button
          return getClassName(isToggled);
        }

        // means we are actually toggling the state with interaction
        const newState = !isToggled;
        cineGetSet.set(newState);
        return getClassName(newState);
      },
    },
  ];
}
