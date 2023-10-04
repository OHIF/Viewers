import { addTool, BrushTool } from '@cornerstonejs/tools';

export default function init({ configuration = {} }): void {
  addTool(BrushTool);
}
