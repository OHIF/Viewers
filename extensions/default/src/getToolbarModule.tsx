import { ToolbarButton as ToolbarButtonLegacy } from '@ohif/ui';
import { ToolButton, utils } from '@ohif/ui-next';

import ToolbarLayoutSelectorWithServices from './Toolbar/ToolbarLayoutSelector';

// legacy
import ToolbarDividerLegacy from './Toolbar/ToolbarDivider';
import ToolbarSplitButtonWithServicesLegacy from './Toolbar/ToolbarSplitButtonWithServices';
import ToolbarButtonGroupWithServicesLegacy from './Toolbar/ToolbarButtonGroupWithServices';
import { ProgressDropdownWithService } from './Components/ProgressDropdownWithService';

// new
import ToolButtonListWrapper from './Toolbar/ToolButtonListWrapper';
import { ToolBoxButtonGroupWrapper, ToolBoxButtonWrapper } from './Toolbar/ToolBoxWrapper';

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
      name: 'ohif.toolBoxButtonGroup',
      defaultComponent: ToolBoxButtonGroupWrapper,
    },
    {
      name: 'ohif.toolBoxButton',
      defaultComponent: ToolBoxButtonWrapper,
    },
    // legacy
    {
      name: 'ohif.radioGroup',
      defaultComponent: ToolbarButtonLegacy,
    },
    {
      name: 'ohif.buttonGroup',
      defaultComponent: ToolbarButtonGroupWithServicesLegacy,
    },
    {
      name: 'ohif.divider',
      defaultComponent: ToolbarDividerLegacy,
    },
    {
      name: 'ohif.splitButton',
      defaultComponent: ToolbarSplitButtonWithServicesLegacy,
    },
    // others
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
        return {
          className: utils.getToggledClassName(isToggled),
        };
      },
    },
  ];
}
