import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

Meteor.startup(() => {
    // Enable the custom tools
    const customTools = [{
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
        OHIF.commands.register('viewer', tool.id, {
            name: tool.name,
            action: () => OHIF.viewerbase.toolManager.setActiveTool(tool.id)
        });
    });
});
