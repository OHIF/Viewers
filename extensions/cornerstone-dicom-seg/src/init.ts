import { addTool, BrushTool } from '@cornerstonejs/tools';

export default function init({ servicesManager }): void {
  addTool(BrushTool);
}
