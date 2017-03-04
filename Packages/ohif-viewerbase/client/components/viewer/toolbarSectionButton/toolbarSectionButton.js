import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { _ } from 'meteor/underscore';
import { toolManager } from '../../../lib/toolManager';

Template.toolbarSectionButton.onCreated(() => {
    const instance = Template.instance();

    instance.isActive = activeToolId => {
        // TODO: Find a way to prevent the 'flash' after a click, but before this helper runs
        const instance = Template.instance();
        const subTools = instance.data.subTools;
        const currentId = instance.data.id;
        const isCurrentTool = currentId === activeToolId;
        const isSubTool = subTools && _.findWhere(subTools, { id: activeToolId });
        const activeCommandButtons = Session.get('ToolManagerActiveCommandButtons') || [];
        const isActiveCommandButton = activeCommandButtons.indexOf(instance.data.id) !== -1;

        // Check if the current tool, a sub tool or a command button is active
        return isCurrentTool || isSubTool || isActiveCommandButton;
    };

    instance.getActiveToolSubProperty = (propertyName, activeToolId) => {
        const instance = Template.instance();
        const subTools = instance.data.subTools;
        const defaultProperty = instance.data[propertyName];
        const currentId = instance.data.id;

        if (subTools && activeToolId !== currentId && instance.isActive(activeToolId)) {
            const subTool = _.findWhere(subTools, { id: activeToolId });
            return subTool ? subTool[propertyName] : defaultProperty;
        } else {
            return defaultProperty;
        }
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
        const activeToolId = Session.get('ToolManagerActiveTool');
        return instance.getActiveToolSubProperty('svgLink', activeToolId);
    },

    iconClasses() {
        const instance = Template.instance();
        const activeToolId = Session.get('ToolManagerActiveTool');
        return instance.getActiveToolSubProperty('iconClasses', activeToolId);
    },

    disableButton() {
        const instance = Template.instance();
        return instance.data.disableFunction && instance.data.disableFunction();
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
        if (tool !== activeTool) {
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
