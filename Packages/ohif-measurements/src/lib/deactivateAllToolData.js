import { OHIF } from 'meteor/ohif:core'

/**
 * Sets all tool data entries value for 'active' to false
 * This is used to remove the active color on entire sets of tools
 */
OHIF.measurements.deactivateAllToolData = () => {
  const toolState = cornerstoneTools.globalImageIdSpecificToolStateManager.saveToolState()

  Object.keys(toolState).forEach(imageId => {
    const toolData = toolState[imageId];

    Object.keys(toolData).forEach(toolType => {
      const specificToolData = toolData[toolType]
      if (!specificToolData || !specificToolData.data || !specificToolData.data.length) {
        return
      }

      specificToolData.data.forEach(data => {
        data.active = false
      });
    });
  });

  cornerstoneTools.globalImageIdSpecificToolStateManager.restoreToolState(toolState)
}
