Meteor.startup(function() {
    toolManager.addTool('bidirectional', {
        mouse: cornerstoneTools.bidirectional,
        touch: cornerstoneTools.bidirectionalTouch
    });

    toolManager.addTool('nonTarget', {
        mouse: cornerstoneTools.nonTarget,
        touch: cornerstoneTools.nonTargetTouch
    });

    toolManager.addTool('scaleOverlayTool', {
        mouse: cornerstoneTools.scaleOverlayTool,
        touch: cornerstoneTools.scaleOverlayTool
    });

    toolManager.addTool('deleteLesionKeyboardTool', {
        mouse: cornerstoneTools.deleteLesionKeyboardTool,
        touch: cornerstoneTools.deleteLesionKeyboardTool
    });

    toolManager.addTool('crTool', {
        mouse: cornerstoneTools.crTool,
        touch: cornerstoneTools.crToolTouch
    });

    toolManager.addTool('unTool', {
        mouse: cornerstoneTools.unTool,
        touch: cornerstoneTools.unToolTouch
    });

    toolManager.addTool('exTool', {
        mouse: cornerstoneTools.exTool,
        touch: cornerstoneTools.exToolTouch
    });

    var states = toolManager.getToolDefaultStates();
    states.deactivate.push('bidirectional');
    states.deactivate.push('nonTarget');
    states.deactivate.push('length');
    states.deactivate.push('crTool');
    states.deactivate.push('unTool');
    states.deactivate.push('exTool');

    states.activate.push('deleteLesionKeyboardTool');
    toolManager.setToolDefaultStates(states);
});