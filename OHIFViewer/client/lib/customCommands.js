import { Meteor } from 'meteor/meteor';
import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

Meteor.startup(() => {
    const { toolManager } = OHIF.viewerbase;
    const contextName = 'viewer';

    // Enable the custom tools
    const customTools = [
        {
            id: 'seed',
            name: 'Seed'
        },
        {
            id: 'render3D',
            name: 'render3D',
            action: OHIF.viewerbase.viewportOverlayUtils.render3D
        }
    ];
    customTools.forEach(tool => {
        _.defaults(OHIF.hotkeys.defaults.viewer, { [tool.id]: '' });
        OHIF.commands.register(contextName, tool.id, {
            name: tool.name,
            action: tool.action || (() => toolManager.setActiveTool(tool.id))
        });
    });

    // // Enable the custom commands
    // const customCommands = [{
    //     id: 'linkStackScroll',
    //     name: 'Link',
    //     action: OHIF.viewerbase.viewportUtils.linkStackScroll
    // }];
    // customCommands.forEach(command => {
    //     _.defaults(OHIF.hotkeys.defaults.viewer, { [command.id]: '' });
    //     OHIF.commands.register(contextName, command.id, {
    //         name: command.name,
    //         action: command.action || (() => toolManager.setActiveTool(command.id))
    //     });
    // });
});
