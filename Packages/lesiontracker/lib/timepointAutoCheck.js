// If timepoint is baseline, sets lesion tool as active tool
setTimepointTools = function(timepoint) {

    // Enabled tools for only follow-up tools
    var fuTools = ["button#crunexTools"];
    if ((timepoint.timepointType).toLowerCase() === "baseline") {
        // Set active tool as lesion tool
        toolManager.setActiveTool('bidirectional');
        toolManager.addDisabledTool({tools: fuTools, status: true});
    } else {
        toolManager.setActiveTool(toolManager.getDefaultTool());
        toolManager.addDisabledTool({tools: fuTools, status: false});
    }
};

timepointAutoCheck = function(templateData) {
    if (templateData && templateData.timepointIds) {
        templateData.timepointIds.forEach(function(timepointId) {
            var timepoint = Timepoints.findOne({timepointId: timepointId});
            setTimepointTools(timepoint);
        });
    }
};