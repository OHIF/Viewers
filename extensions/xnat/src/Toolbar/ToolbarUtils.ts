/**
 * Toolbar utility functions
 * Extracted from getToolbarModule.tsx
 */

import { utils } from '@ohif/ui-next';
import { Enums } from '@cornerstonejs/tools';
import type { ToggleEvaluateParams, EvaluateFunctionResult } from './ToolbarTypes';

// Helper function for disabled state
export const getDisabledState = (disabledText?: string) => ({
  disabled: true,
  className: '!text-common-bright ohif-disabled',
  disabledText: disabledText || 'Not available',
});

/**
 * Evaluate toggle state for cornerstone tools
 * @param params - Parameters for toggle evaluation
 * @returns Evaluation result
 */
export function _evaluateToggle({
  viewportId,
  toolbarService,
  button,
  disabledText,
  offModes,
  toolGroupService,
}: ToggleEvaluateParams): EvaluateFunctionResult | undefined {
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
