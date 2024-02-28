import ToolbarDivider from './Toolbar/ToolbarDivider';
import ToolbarLayoutSelectorWithServices from './Toolbar/ToolbarLayoutSelector';
import ToolbarSplitButtonWithServices from './Toolbar/ToolbarSplitButtonWithServices';
import { ToolbarButton } from '@ohif/ui';

export default function getToolbarModule({ commandsManager, servicesManager }) {
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
  ];
}
