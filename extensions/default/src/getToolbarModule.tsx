import { ToolbarButton as ToolbarButtonLegacy } from '@ohif/ui';
import { ToolButton } from '@ohif/ui-next';

import ToolbarDivider from './Toolbar/ToolbarDivider';
import ToolbarLayoutSelectorWithServices from './Toolbar/ToolbarLayoutSelector';
import ToolbarSplitButtonWithServices from './Toolbar/ToolbarSplitButtonWithServices';
import ToolbarButtonGroupWithServices from './Toolbar/ToolbarButtonGroupWithServices';
import { ProgressDropdownWithService } from './Components/ProgressDropdownWithService';
import ToolButtonListWrapper from './Toolbar/ToolButtonListWrapper';

const getClassName = isToggled => {
  return {
    className: isToggled
      ? '!text-primary-active'
      : '!text-common-bright hover:!bg-primary-dark hover:text-primary-light',
  };
};

export default function getToolbarModule({ commandsManager, servicesManager }: withAppTypes) {
  const { cineService } = servicesManager.services;
  return [
    // new
    {
      name: 'ohif.toolButton',
      defaultComponent: ToolButton,
    },
    {
      name: 'ohif.toolButtonList',
      defaultComponent: ToolButtonListWrapper,
    },
    {
      name: 'ohif.toolButtonGroup',
      defaultComponent: ToolbarButtonGroupWithServices,
    },
    // legacy
    {
      name: 'ohif.radioGroup',
      defaultComponent: ToolbarButtonLegacy,
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
      defaultComponent: props =>
        ToolbarLayoutSelectorWithServices({ ...props, commandsManager, servicesManager }),
    },
    {
      name: 'ohif.progressDropdown',
      defaultComponent: ProgressDropdownWithService,
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
