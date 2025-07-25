import { ToolButton, utils } from '@ohif/ui-next';
import { Types } from '@ohif/core';
import { Enums } from '@cornerstonejs/tools';

import ToolbarLayoutSelectorWithServices from './Toolbar/ToolbarLayoutSelector';

// legacy
import ToolbarDividerLegacy from './Toolbar/ToolbarDivider';
import ToolbarSplitButtonWithServicesLegacy from './Toolbar/ToolbarSplitButtonWithServices';
import ToolbarButtonGroupWithServicesLegacy from './Toolbar/ToolbarButtonGroupWithServices';
import { ProgressDropdownWithService } from './Components/ProgressDropdownWithService';

// new
import ToolButtonListWrapper from './Toolbar/ToolButtonListWrapper';
import { ToolBoxButtonGroupWrapper, ToolBoxButtonWrapper } from './Toolbar/ToolBoxWrapper';

// Define the withAppTypes interface to match ExtensionParams
interface withAppTypes {
  servicesManager: any;
  extensionManager: any;
  commandsManager: any;
}

// Helper function for disabled state
const getDisabledState = (disabledText?: string) => ({
  disabled: true,
  className: '!text-common-bright ohif-disabled',
  disabledText: disabledText || 'Not available',
});

export default function getToolbarModule({ commandsManager, servicesManager }: withAppTypes) {
  const { 
    cineService,
    segmentationService,
    toolGroupService,
    toolbarService,
    cornerstoneViewportService,
    colorbarService,
    displaySetService,
    viewportGridService,
  } = servicesManager.services;

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
      defaultComponent: ToolButton,
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
    {
      name: 'evaluate.cornerstone.hasSegmentation',
      evaluate: ({ viewportId }) => {
        const segmentations = segmentationService.getSegmentationRepresentations(viewportId);
        return {
          disabled: !segmentations?.length,
        };
      },
    },
    {
      name: 'evaluate.cornerstone.segmentation',
      evaluate: ({ viewportId, button, toolNames, disabledText }) => {
        // Check if segmentations exist for this viewport
        const segmentations = segmentationService.getSegmentationRepresentations(viewportId);
        if (!segmentations?.length) {
          return {
            disabled: true,
            disabledText: disabledText ?? 'No segmentations available',
          };
        }

        const activeSegmentation = segmentationService.getActiveSegmentation(viewportId);
        if (!Object.keys(activeSegmentation.segments).length) {
          return {
            disabled: true,
            disabledText: 'Add segment to enable this tool',
          };
        }

        const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);

        if (!toolGroup) {
          return {
            disabled: true,
            disabledText: disabledText ?? 'Not available on the current viewport',
          };
        }

        if (!toolNames) {
          return {
            disabled: false,
          };
        }

        const toolName = toolbarService.getToolNameForButton(button);

        if (!toolGroup.hasTool(toolName) && !toolNames) {
          return {
            disabled: true,
            disabledText: disabledText ?? 'Not available on the current viewport',
          };
        }

        const isPrimaryActive = toolNames
          ? toolNames.includes(toolGroup.getActivePrimaryMouseButtonTool())
          : toolGroup.getActivePrimaryMouseButtonTool() === toolName;

        return {
          disabled: false,
          isActive: isPrimaryActive,
        };
      },
    },
    {
      name: 'evaluate.displaySetIsReconstructable',
      evaluate: ({ viewportId, disabledText = 'Selected viewport is not reconstructable' }) => {
        const { viewportGridService, displaySetService } = servicesManager.services;
        
        if (!viewportId) {
          return {
            disabled: true,
            disabledText,
          };
        }

        const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);
        if (!displaySetUIDs?.length) {
          return {
            disabled: true,
            disabledText,
          };
        }

        const displaySets = displaySetUIDs.map(displaySetService.getDisplaySetByUID);
        const areReconstructable = displaySets.every(displaySet => {
          return displaySet?.isReconstructable;
        });

        if (!areReconstructable) {
          return {
            disabled: true,
            disabledText,
          };
        }

        return {
          disabled: false,
        };
      },
    },
    {
      name: 'evaluate.cornerstoneTool',
      evaluate: ({ viewportId, button, toolNames, disabledText }) => {
        const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);

        if (!toolGroup) {
          return;
        }

        const toolName = toolbarService.getToolNameForButton(button);

        if (!toolGroup || (!toolGroup.hasTool(toolName) && !toolNames)) {
          return getDisabledState(disabledText);
        }

        const isPrimaryActive = toolNames
          ? toolNames.includes(toolGroup.getActivePrimaryMouseButtonTool())
          : toolGroup.getActivePrimaryMouseButtonTool() === toolName;
        return {
          disabled: false,
          isActive: isPrimaryActive,
        };
      },
    },
    {
      name: 'evaluate.cornerstoneTool.toggle',
      evaluate: ({ viewportId, button, disabledText }) =>
        _evaluateToggle({
          viewportId,
          button,
          toolbarService,
          disabledText,
          offModes: [Enums.ToolModes.Disabled, Enums.ToolModes.Passive],
          toolGroupService,
        }),
    },
    {
      name: 'evaluate.cornerstoneTool.toggle.ifStrictlyDisabled',
      evaluate: ({ viewportId, button, disabledText }) =>
        _evaluateToggle({
          viewportId,
          button,
          toolbarService,
          disabledText,
          offModes: [Enums.ToolModes.Disabled],
          toolGroupService,
        }),
    },
    {
      name: 'evaluate.action',
      evaluate: () => ({}),
    },
  ];
}

function _evaluateToggle({
  viewportId,
  toolbarService,
  button,
  disabledText,
  offModes,
  toolGroupService,
}) {
  const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);

  if (!toolGroup) {
    return;
  }
  const toolName = toolbarService.getToolNameForButton(button);

  if (!toolGroup?.hasTool(toolName)) {
    return getDisabledState(disabledText);
  }

  const isOff = offModes.includes(toolGroup.getToolOptions(toolName).mode);

  return {
    className: utils.getToggledClassName(!isOff),
  };
}
