import ToolbarDivider from './Toolbar/ToolbarDivider';
import ToolbarLayoutSelectorWithServices from './Toolbar/ToolbarLayoutSelector';
import ToolbarSplitButtonWithServices from './Toolbar/ToolbarSplitButtonWithServices';
import ToolWithStackedOptions from './Toolbar/ToolWithStackedOptions';
import { ToolbarButton } from '@ohif/ui';

const getClassName = isToggled => {
  return {
    className: isToggled
      ? '!text-primary-active'
      : '!text-common-bright hover:!bg-primary-dark hover:text-primary-light',
  };
};

export default function getToolbarModule({ commandsManager, servicesManager }) {
  const { cineService } = servicesManager.services;
  return [
    {
      name: 'ohif.radioGroup',
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
      name: 'ohif.advancedTool.WithStackedOptions',
      defaultComponent: ToolWithStackedOptions,
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
      name: 'evaluate.cine',
      evaluate: () => {
        const isToggled = cineService.getState().isCineEnabled;
        return getClassName(isToggled);
      },
    },
  ];
}
