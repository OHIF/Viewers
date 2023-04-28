/**
 * Finds tool nearby event position triggered.
 *
 * @param {Object} commandsManager mannager of commands
 * @param {Object} event that has being triggered
 * @returns cs toolData or undefined if not found.
 */
export const findNearbyToolData = (commandsManager, evt) => {
  if (!evt?.detail) {
    return;
  }
  const { element, currentPoints } = evt.detail;
  return commandsManager.runCommand(
    'getNearbyAnnotation',
    {
      element,
      canvasCoordinates: currentPoints?.canvas,
    },
    'CORNERSTONE'
  );
};
