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

    instance.autorun(computation => {
        // Get the last executed command
        const lastCommand = Session.get('lastCommand');

        // Prevent running this computation on its first run
        if (computation.firstRun) return;

        // Stop here if it's not the last command or if it's already an active tool
        const { id } = instance.data;
        if (lastCommand !== id || instance.isActive(id)) return;

        // Add an active class to a button for 100ms to give the impression the button was pressed
        const $button = instance.$('.toolbarSectionButton:first');
        $button.addClass('active');
        setTimeout(() => $button.removeClass('active'), 100);
    });
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
    'click .toolbarSectionButton:not(.expandable)'(event, instance) {
        // Prevent the event from bubbling to parent tools
        event.stopPropagation();

        // Stop here if the button is disabled
        if ($(event.currentTarget).hasClass('disabled')) return;

        // Run the command attached to the button
        OHIF.commands.run(instance.data.id);
    }
});
