import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { _ } from 'meteor/underscore';

Template.toolbarSectionButton.onCreated(() => {
    const instance = Template.instance();

    instance.isActive = activeToolId => {
        OHIF.commands.last.dep.depend();
        const subTools = instance.data.subTools;
        const currentId = instance.data.id;
        const isCurrentTool = currentId === activeToolId;
        const isSubTool = subTools && _.findWhere(subTools, { id: activeToolId });
        const activeCommandButtons = Session.get('ToolManagerActiveCommandButtons') || [];
        const isActiveCommandButton = activeCommandButtons.indexOf(instance.data.id) !== -1;
        const isActive = typeof instance.data.active === 'function' && instance.data.active();

        // Check if the current tool, a sub tool or a command button is active
        return isActive || isCurrentTool || isSubTool || isActiveCommandButton;
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
        Session.get('ToolManagerActiveToolUpdated');

        // Get the last executed command
        const lastCommand = OHIF.commands.last.get();

        // Prevent running this computation on its first run
        if (computation.firstRun) return;

        // Stop here if it's not the last command or if it's already an active tool
        const { id } = instance.data;
        const activeToolId = OHIF.viewerbase.toolManager.getActiveTool();
        if (lastCommand !== id || instance.isActive(activeToolId)) return;

        // Add an active class to a button for 100ms to give the impression the button was pressed
        const flashButton = $element => {
            $element.addClass('active');
            setTimeout(() => {
                if ($element.hasClass('expandable') && $element.find('.toolbarSectionButton.active').length) return;

                const activeToolId = OHIF.viewerbase.toolManager.getActiveTool();
                const isActive = instance.isActive(activeToolId);
                if (!isActive) {
                    $element.removeClass('active');
                }
            }, 100);
        };

        // Flash the active button
        const $button = instance.$('.toolbarSectionButton').first();
        flashButton($button);

        // Flash the parent button as well in case of this button is inside a drawer
        const $parentButton = $button.closest('.toolbarSectionButton.expandable');
        if ($parentButton.length) {
            flashButton($parentButton);
        }
    });
});

Template.toolbarSectionButton.helpers({
    activeClass() {
        Session.get('ToolManagerActiveToolUpdated');
        const instance = Template.instance();
        const activeToolId = OHIF.viewerbase.toolManager.getActiveTool();
        const isActive = instance.isActive(activeToolId);
        return isActive ? 'active' : '';
    },

    svgLink() {
        Session.get('ToolManagerActiveToolUpdated');
        const instance = Template.instance();
        const activeToolId = OHIF.viewerbase.toolManager.getActiveTool();
        const svgLink = instance.getActiveToolSubProperty('svgLink', activeToolId);
        return _.isFunction(svgLink) ? svgLink() : svgLink;
    },

    iconClasses() {
        Session.get('ToolManagerActiveToolUpdated');
        const instance = Template.instance();
        const activeToolId = OHIF.viewerbase.toolManager.getActiveTool();
        const iconClasses = instance.getActiveToolSubProperty('iconClasses', activeToolId);
        return _.isFunction(iconClasses) ? iconClasses() : iconClasses;
    },

    disableButton() {
        Session.get('activeViewport');
        Session.get('LayoutManagerUpdated');
        const instance = Template.instance();
        const isCommandDisabled = OHIF.commands.isDisabled(instance.data.id);
        const isFunctionDisabled = instance.data.disableFunction && instance.data.disableFunction();
        return isCommandDisabled || isFunctionDisabled;
    },

    hasSubTools() {
        return this.subTools || this.subToolsTemplateName;
    }
});

Template.toolbarSectionButton.events({
    'click .toolbarSectionButton:not(.expandable)'(event, instance) {
        // Prevent the event from bubbling to parent tools
        event.stopPropagation();
        const $currentTarget = $(event.currentTarget);

        // Stop here if the button is disabled or customAction
        if ($currentTarget.hasClass('disabled') || $currentTarget.hasClass('customAction')) {
            return;
        }

        // Run the command attached to the button
        OHIF.commands.run(instance.data.id);
    }
});
