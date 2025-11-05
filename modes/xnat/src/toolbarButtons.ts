import { Button } from '@ohif/core/src/types';

// Import toolbar button modules
import { navigationButtons } from './navigationButtons';
import { viewportButtons } from './viewportButtons';
import { measurementButtons } from './measurementButtons';
import { segmentationButtons } from './segmentationButtons';
import { utilityButtons } from './utilityButtons';
import { sectionHeaders } from './sectionHeaders';

// Re-export constants for backward compatibility
export { setToolActiveToolbar, VIEWPORT_GRID_EVENTS, ReferenceLinesListeners, callbacks } from './toolbarConstants';

// Combine all toolbar buttons into a single array
const toolbarButtons: Button[] = [
  ...navigationButtons,
  ...sectionHeaders,
  ...measurementButtons,
  ...segmentationButtons,
  ...utilityButtons,
  ...viewportButtons,
];

export default toolbarButtons;