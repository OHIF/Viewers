Template.toolbar.helpers({
  studies : function() {
    var studies = Session.get('studies');
    return studies;
  }
});

Template.toolbar.events({
    'click .imageViewerTool': function(e) {
        var tool = e.currentTarget.id;
        console.log('Setting active tool to: ' + tool);
        toolManager.setActiveTool(tool);
    },
    'click .imageViewerCommand': function(e) {
        var command = e.currentTarget.id;
        if (!OHIF.viewer.functionList.hasOwnProperty(command)) {
            return;
        }
        var viewportIndex = Session.get('ActiveViewport');
        var element = $('.imageViewerViewport').get(viewportIndex);
        OHIF.viewer.functionList[command](element);
    }
});

Template.toolbar.onRendered(function() {
    var tooltipButtons = $('[data-toggle="tooltip"]');
    tooltipButtons.tooltip(OHIF.viewer.tooltipConfig);

    // Enable tooltips for the layout button
    var extraTooltipButtons = $('[rel="tooltip"]');
    extraTooltipButtons.tooltip(OHIF.viewer.tooltipConfig);
});

Template.toolbar.helpers({
    'isPlaying': function() {
        Session.get('UpdateCINE');
        var viewportIndex = Session.get('ActiveViewport');
        return !!OHIF.viewer.isPlaying[viewportIndex];
    }
});