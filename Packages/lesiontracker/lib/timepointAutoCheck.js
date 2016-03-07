// If timepoint is baseline, sets lesion tool as active tool
setTimepointTools = function(timepoint) {

    // Enabled tools for only follow-up tools
    var fuTools = ["button#crunexTools"];
    var fuToolsJQ = $("button#crunexTools");
    var isDisabled = false;
    if ((timepoint.timepointType).toLowerCase() === "baseline") {
        // Set active tool as lesion tool
        toolManager.setActiveTool('bidirectional');
        isDisabled = true;
    } else {
        toolManager.setActiveTool(toolManager.getDefaultTool());
        isDisabled = false;
    }

    toolManager.addDisabledTool({tools: fuTools, status: isDisabled});
    fuToolsJQ.prop('disabled', isDisabled);
};

timepointAutoCheck = function(templateData) {
    if (templateData && templateData.timepointIds) {
        templateData.timepointIds.forEach(function(timepointId) {
            var timepoint = Timepoints.findOne({timepointId: timepointId});
            setTimepointTools(timepoint);
        });
    }
};