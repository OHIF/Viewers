// If timepoint is baseline, sets lesion tool as active tool
setTimepointTools = function(timepoint) {
    if (!timepoint) {
        return;
    }

    var disabledBaselineTools = ["crunexTools"];
    var states = toolManager.getToolDefaultStates();
    var disabledToolButtons = states.disabledToolButtons;

    if (timepoint.timepointType === "baseline") {
        // Set active tool as lesion tool
        toolManager.setActiveTool('bidirectional');
        disabledBaselineTools.forEach(function(tool) {
            var index = disabledToolButtons.indexOf(tool);
            if (index === -1) {
                disabledToolButtons.push(tool);
            }
        });
    } else {
        toolManager.setActiveTool(toolManager.getDefaultTool());
        // Remove disabled baseline tools
        disabledBaselineTools.forEach(function(tool) {
            var index = disabledToolButtons.indexOf(tool);
            if (index !== -1) {
                disabledToolButtons.splice(index, 1);
            }
        });
    }

    states.disabledToolButtons = disabledToolButtons;
    toolManager.setToolDefaultStates(states);
};

timepointAutoCheck = function(templateData) {
    if (templateData && templateData.timepointIds) {
        templateData.timepointIds.forEach(function(timepointId) {
            var timepoint = Timepoints.findOne({timepointId: timepointId});
            setTimepointTools(timepoint);
        });
    }
};