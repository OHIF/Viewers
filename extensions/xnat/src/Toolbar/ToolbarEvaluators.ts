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
        // Enable segmentation tools as long as there is at least one segmentation
        // with at least one segment anywhere (viewport-agnostic). This avoids
        // blocking tools in MPR or other protocols that may not yet have a
        // representation attached to the specific viewport.
        const allSegmentations = segmentationService.getSegmentations?.() ?? [];
        const hasSegments = allSegmentations.some(
          seg => seg?.segments && Object.keys(seg.segments).length > 0
        );

        const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);
        const evaluatedToolName = toolbarService.getToolNameForButton(button);

        // Debug logging to understand why segmentation tools are (not) active
        // in different hanging protocols / viewports.
        console.log('[XNAT evaluate.cornerstone.segmentation]', {
          viewportId,
          buttonId: button?.id,
          toolName: evaluatedToolName,
          toolNames,
          hasSegments,
          toolGroupId: toolGroup?.id,
          activePrimaryTool: toolGroup?.getActivePrimaryMouseButtonTool?.(),
        });

        if (!hasSegments) {
          return {
            disabled: true,
            disabledText: disabledText ?? 'Add segment to enable this tool',
          };
        }
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

        const toolName = evaluatedToolName;

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
