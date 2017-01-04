import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { _ } from 'meteor/underscore';

Template.toolbarSectionButton.onCreated(() => {
    const instance = Template.instance();

    instance.isActive = activeToolId => {
        // TODO: Find a way to prevent the 'flash' after a click, but before this helper runs
        const instance = Template.instance();
        const subTools = instance.data.subTools;
        const currentId = instance.data.id;
        const isCurrentTool = currentId === activeToolId;
        const isSubTool = subTools && _.findWhere(subTools, { id: activeToolId });

        // Check if the current tool or a sub tool is the active one
        return isCurrentTool || isSubTool;
    };
});

Template.toolbarSectionButton.helpers({
    activeClass() {
        const instance = Template.instance();
        const activeToolId = Session.get('ToolManagerActiveTool');
        const isActive = instance.isActive(activeToolId);
        return isActive ? 'active' : '';
    },

    svgLink() {
        const instance = Template.instance();
        const subTools = instance.data.subTools;
        const defaultSvgLink = instance.data.svgLink;
        const activeToolId = Session.get('ToolManagerActiveTool');
        const currentId = instance.data.id;

        if (subTools && activeToolId !== currentId && instance.isActive(activeToolId)) {
            const subTool = _.findWhere(subTools, { id: activeToolId });
            return subTool ? subTool.svgLink : defaultSvgLink;
        } else {
            return defaultSvgLink;
        }
    },

    disableButton() {
        const instance = Template.instance();
        return instance.disableFunction && instance.disableFunction();
    }
});

Template.toolbarSectionButton.events({
    'click .imageViewerTool'(event, instance) {
        // Prevent the event from bubbling to parent tools
        event.stopPropagation();

        // Stop here if the tool is disabled
        if ($(event.currentTarget).hasClass('disabled')) {
            return;
        }

        const tool = event.currentTarget.id;
        const elements = instance.$('.imageViewerViewport');

        const activeTool = toolManager.getActiveTool();
        if (tool === activeTool) {
            const defaultTool = toolManager.getDefaultTool();
            OHIF.log.info('Setting active tool to: ' + defaultTool);
            toolManager.setActiveTool(defaultTool, elements);
        } else {
            OHIF.log.info('Setting active tool to: ' + tool);
            toolManager.setActiveTool(tool, elements);
        }
    },

    'click .imageViewerCommand'(event, instance) {
        // Prevent the event from bubbling to parent tools
        event.stopPropagation();

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
