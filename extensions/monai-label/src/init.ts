import { addTool } from '@cornerstonejs/tools';
import { Types } from '@ohif/core';
import ProbeMONAILabelTool from './tools/ProbeMONAILabelTool';

/**
 * @param {object} configuration
 */
export default function init({
  servicesManager,
  configuration = {},
}: Types.Extensions.ExtensionParams): void {
  addTool(ProbeMONAILabelTool);
}
