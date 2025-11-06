/**
 * Toolbar evaluation functions
 * Extracted from getToolbarModule.tsx
 */

import { utils } from '@ohif/ui-next';
import { Enums } from '@cornerstonejs/tools';

import { getDisabledState, _evaluateToggle } from './ToolbarUtils';
import type { ToolbarModuleItem, withAppTypes, EvaluateFunctionParams, EvaluateFunctionResult } from './ToolbarTypes';

/**
 * Get toolbar evaluators
 * @param servicesManager - Services manager containing toolbar services
 * @returns Array of toolbar evaluator configurations
 */
export function getToolbarEvaluators(servicesManager: any): ToolbarModuleItem[] {
  const {
    cineService,
    segmentationService,
    toolGroupService,
    toolbarService,
    displaySetService,
    viewportGridService,
  } = servicesManager.services;

  return [
    {
      name: 'evaluate.group.promoteToPrimary',
      evaluate: ({ viewportId, button, itemId }: EvaluateFunctionParams): EvaluateFunctionResult => {
        const { items } = button.props;

        if (!itemId) {
          return {
            primary: button.props.primary,
            items,
          };
        }

        // otherwise we can move the clicked tool to the primary button
        const clickedItemProps = items.find((item: any) => item.id === itemId || item.itemId === itemId);

        return {
          primary: clickedItemProps,
          items,
        };
      },
    },
    {
      name: 'evaluate.cine',
      evaluate: (): EvaluateFunctionResult => {
        const isToggled = cineService.getState().isCineEnabled;
        return {
          className: utils.getToggledClassName(isToggled),
        };
      },
    },
    {
      name: 'evaluate.cornerstone.hasSegmentation',
      evaluate: ({ viewportId }: EvaluateFunctionParams): EvaluateFunctionResult => {
        const segmentations = segmentationService.getSegmentationRepresentations(viewportId);
        return {
          disabled: !segmentations?.length,
        };
      },
    },
    {
      name: 'evaluate.cornerstone.segmentation',
      evaluate: ({ viewportId, button, toolNames, disabledText }: EvaluateFunctionParams): EvaluateFunctionResult => {
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
      evaluate: ({ viewportId, disabledText = 'Selected viewport is not reconstructable' }: EvaluateFunctionParams): EvaluateFunctionResult => {
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
      evaluate: ({ viewportId, button, toolNames, disabledText }: EvaluateFunctionParams): EvaluateFunctionResult => {
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
      evaluate: ({ viewportId, button, disabledText }: EvaluateFunctionParams): EvaluateFunctionResult =>
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
      evaluate: ({ viewportId, button, disabledText }: EvaluateFunctionParams): EvaluateFunctionResult =>
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
      evaluate: (): EvaluateFunctionResult => ({}),
    },
  ];
}
