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
        _.defaults(OHIF.hotkeys.defaults[contextName], { [tool.id]: '' });
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
        _.defaults(OHIF.hotkeys.defaults[contextName], { [command.id]: '' });
        OHIF.commands.register(contextName, command.id, {
            name: command.name,
            action: command.action || (() => toolManager.setActiveTool(command.id))
        });
    });

    // Add the save command
    OHIF.commands.register(contextName, 'storeMeasurements', () => {
        // Register the hotkey default
        _.defaults(OHIF.hotkeys.defaults[contextName], { storeMeasurements: '' });

        // Clear signaled unsaved changes...
        const successHandler = () => {
            OHIF.ui.unsavedChanges.clear(`${instance.path}.*`);
            instance.saveObserver.changed();
        };

        // Display the error messages
        const errorHandler = data => {
            OHIF.ui.showDialog('dialogInfo', Object.assign({ class: 'themed' }, data));
        };

        const promise = OHIF.viewer.measurementApi.storeMeasurements();
        promise.then(successHandler).catch(errorHandler);
        OHIF.ui.showDialog('dialogLoading', {
            promise,
            text: 'Saving measurement data'
        });

        return promise;
    });
});
