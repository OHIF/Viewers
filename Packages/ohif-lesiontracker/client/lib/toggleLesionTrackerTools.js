import { OHIF } from 'meteor/ohif:core';

/**
 * Show / hide lesion tracker tools
 */

let previousStates;
let previousActiveTool;

let toolsShown = true;

OHIF.lesiontracker.toggleLesionTrackerTools = () => {
    if (toolsShown === true) {
        // Save the current settings for later
        previousStates = toolManager.getToolDefaultStates();
        previousActiveTool = toolManager.getActiveTool();

        // Hide the tools (set them all to disabled)
        const toolDefaultStates = {
            activate: [ 'deleteLesionKeyboardTool' ],
            deactivate: [],
            enable: [],
            disable: [ 'bidirectional', 'nonTarget', 'length', 'crTool', 'unTool', 'exTool' ]
        };

        toolManager.setToolDefaultStates(toolDefaultStates);

        // Using setActiveTool with no arguments activates the
        // default tool on all available viewports
        toolManager.setActiveTool();

        toolsShown = false;
    } else {
        // Show the tools (reload previous states)
        toolManager.setToolDefaultStates(previousStates);

        // Using setActiveTool with no elements specified activates
        // the specified tool on all available viewports
        toolManager.setActiveTool(previousActiveTool);

        toolsShown = true;
    }
};

OHIF.lesiontracker.toggleLesionTrackerToolsButtons = (isEnabled) => {
    const toolStates = previousStates || toolManager.getToolDefaultStates();

    if (isEnabled) {
        toolStates.disabledToolButtons = [];
    } else {
        toolStates.disabledToolButtons = [ 'bidirectional', 'nonTarget', 'crTool', 'unTool', 'exTool', 'toggleHUD', 'toggleTrial', 'toolbarSectionEntry' ];
    }

    // Reload the updated previous or default states
    toolManager.setToolDefaultStates(toolStates);

    // Reset the active tool if disabled
    if (!isEnabled) {
        toolManager.setActiveTool();
    }
};