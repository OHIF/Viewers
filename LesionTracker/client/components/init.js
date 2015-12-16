Meteor.startup(function() {
    toolManager.addTool('lesion', {
        mouse: cornerstoneTools.lesion,
        touch: cornerstoneTools.lesionTouch
    });
    
    toolManager.addTool('nonTarget', {
        mouse: cornerstoneTools.nonTarget,
        touch: cornerstoneTools.nonTargetTouch
    });

    toolManager.addTool('biDirectional', {
        mouse: cornerstoneTools.biDirectional,
        touch: cornerstoneTools.biDirectionalTouch
    });

    var states = toolManager.getToolDefaultStates();
    states.deactivate.push('lesion');
    states.deactivate.push('nonTarget');

    toolManager.setToolDefaultStates(states);
});