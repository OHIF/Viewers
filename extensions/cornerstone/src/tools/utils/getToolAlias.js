/**
 * Get cornerstone tool alias.
 *
 * @param {string} toolName
 * @returns tool alias
 */
export default function getToolAlias(toolName) {
  let toolAlias = toolName;

  switch (toolName) {
    case 'Length':
      toolAlias = 'SRLength';
      break;
    case 'Bidirectional':
      toolAlias = 'SRBidirectional';
      break;
    case 'ArrowAnnotate':
      toolAlias = 'SRArrowAnnotate';
      break;
    case 'EllipticalRoi':
      toolAlias = 'SREllipticalRoi';
      break;
    case 'FreehandRoi':
      toolAlias = 'SRFreehandRoi';
      break;
    case 'RectangleRoi':
      toolAlias = 'SRRectangleRoi';
      break;
  }

  return toolAlias;
}
