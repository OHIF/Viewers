import { Meteor } from 'meteor/meteor';
import { Viewerbase } from 'meteor/ohif:viewerbase';

Meteor.startup(function() {
    const toolManager = Viewerbase.toolManager;

    toolManager.addTool('bidirectional', {
        mouse: cornerstoneTools.bidirectional,
        touch: cornerstoneTools.bidirectionalTouch
    });

    toolManager.addTool('nonTarget', {
        mouse: cornerstoneTools.nonTarget,
        touch: cornerstoneTools.nonTargetTouch
    });

    toolManager.addTool('deleteLesionKeyboardTool', {
        mouse: cornerstoneTools.deleteLesionKeyboardTool,
        touch: cornerstoneTools.deleteLesionKeyboardTool
    });

    toolManager.addTool('targetCR', {
        mouse: cornerstoneTools.targetCR,
        touch: cornerstoneTools.targetCRTouch
    });

    toolManager.addTool('targetUN', {
        mouse: cornerstoneTools.targetUN,
        touch: cornerstoneTools.targetUNTouch
    });

    // Update default state for tools making sure each tool is only inserted once
    let currentDefaultStates = toolManager.getToolDefaultStates();
    let newDefaultStates = {
        enable: [],
        deactivate: ['bidirectional', 'nonTarget', 'length', 'targetCR', 'targetUN'],
        activate: ['deleteLesionKeyboardTool']
    };

    Object.keys(newDefaultStates).forEach(state => {
        newDefaultStates[state].forEach(tool => {
            let tools = currentDefaultStates[state];
            // make sure each tool is only inserted once
            if (tools && tools.indexOf(tool) < 0) {
                tools.push(tool);
            }
        });
    });

    toolManager.setToolDefaultStates(currentDefaultStates);
});
