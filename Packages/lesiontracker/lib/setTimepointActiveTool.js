// If timepoint is baseline, sets lesion tool as active tool
// Else sets default tool
setTimepointActiveTool = function(timepoint) {
    if ((timepoint.timepointType).toLowerCase() === "baseline") {
        // Set active tool as lesion tool
        toolManager.setActiveTool('lesion');
    } else {
        toolManager.setActiveTool(toolManager.getDefaultTool());
    }
};