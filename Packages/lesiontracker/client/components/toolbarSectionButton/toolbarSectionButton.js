import { OHIF } from 'meteor/ohif:core';

Template.toolbarSectionButton.helpers({
    activeClass() {
        const instance = Template.instance();

        // Check if the current tool is the active one
        if (instance.data.id === Session.get('ToolManagerActiveTool')) {
            // Return the active class
            return 'active';
        }

        return;
    }
});

Template.toolbarSectionButton.events({
    'click .imageViewerTool'(event, instance) {
        $(event.currentTarget).tooltip('hide');

        var tool = event.currentTarget.id;

        var elements = $('.imageViewerViewport');

        var activeTool = toolManager.getActiveTool();
        if (tool === activeTool) {
            var defaultTool = toolManager.getDefaultTool();
            console.log('Setting active tool to: ' + defaultTool);
            toolManager.setActiveTool(defaultTool, elements);
        } else {
            console.log('Setting active tool to: ' + tool);
            toolManager.setActiveTool(tool, elements);
        }
    },
    'click .imageViewerCommand'(event, instance) {
        $(event.currentTarget).tooltip('hide');

        var command = event.currentTarget.id;
        if (!OHIF.viewer.functionList.hasOwnProperty(command)) {
            return;
        }

        var activeViewport = Session.get('activeViewport');
        var element = $('.imageViewerViewport').get(activeViewport);
        OHIF.viewer.functionList[command](element);
    }
});
