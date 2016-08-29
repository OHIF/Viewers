import { OHIF } from 'meteor/ohif:core';

Template.toolbarSectionButton.helpers({
    activeClass() {
        // TODO: Find a way to prevent the 'flash' after a click, but before this helper runs
        const instance = Template.instance();

        // Check if the current tool is the active one
        if (instance.data.id === Session.get('ToolManagerActiveTool')) {
            // Return the active class
            return 'active';
        }
    }
});

Template.toolbarSectionButton.events({
    'click .imageViewerTool'(event, instance) {
        // Stop here if the tool is disabled
        if ($(event.currentTarget).hasClass('disabled')) {
            return;
        }

        const tool = event.currentTarget.id;
        const elements = instance.$('.imageViewerViewport');

        const activeTool = toolManager.getActiveTool();
        if (tool === activeTool) {
            const defaultTool = toolManager.getDefaultTool();
            log.info('Setting active tool to: ' + defaultTool);
            toolManager.setActiveTool(defaultTool, elements);
        } else {
            log.info('Setting active tool to: ' + tool);
            toolManager.setActiveTool(tool, elements);
        }
    },
    'click .imageViewerCommand'(event, instance) {
        // Stop here if the tool is disabled
        if ($(event.currentTarget).hasClass('disabled')) {
            return;
        }

        const command = event.currentTarget.id;
        if (!OHIF.viewer.functionList || !OHIF.viewer.functionList.hasOwnProperty(command)) {
            return;
        }

        const activeViewport = Session.get('activeViewport');
        const element = $('.imageViewerViewport').get(activeViewport);
        OHIF.viewer.functionList[command](element);
    }
});
