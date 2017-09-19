import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

Meteor.startup(() => {
    const { toolManager } = OHIF.viewerbase;
    const contextName = 'viewer';

    // Enable the custom tools
    const customTools = [{
        id: 'bidirectional',
        name: 'Target'
    }, {
        id: 'nonTarget',
        name: 'Non-Target'
    }, {
        id: 'targetCR',
        name: 'CR Target'
    }, {
        id: 'targetUN',
        name: 'UN Target'
    }];
    customTools.forEach(tool => {
        _.defaults(OHIF.hotkeys.defaults.viewer, { [tool.id]: '' });
        OHIF.commands.register(contextName, tool.id, {
            name: tool.name,
            action: tool.action || (() => toolManager.setActiveTool(tool.id))
        });
    });

    // Enable the custom commands
    const customCommands = [{
        id: 'linkStackScroll',
        name: 'Link',
        action: OHIF.viewerbase.viewportUtils.linkStackScroll
    }];
    customCommands.forEach(command => {
        _.defaults(OHIF.hotkeys.defaults.viewer, { [command.id]: '' });
        OHIF.commands.register(contextName, command.id, {
            name: command.name,
            action: command.action || (() => toolManager.setActiveTool(command.id))
        });
    });
});
