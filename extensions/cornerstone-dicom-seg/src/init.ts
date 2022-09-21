import SegmentationCrosshairs from './tools/SegmentationCrosshairs';
import { addTool } from '@cornerstonejs/tools';

export default function init({
  servicesManager,
  commandsManager,
  configuration,
}) {
  addTool(SegmentationCrosshairs);
}
