import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';
import { Servers } from 'meteor/ohif:servers/both/collections';
import { ServerConfiguration } from 'meteor/ohif:servers/both/schema/servers.js';

// Validate the servers configuration
Meteor.startup(() => {
    // Save custom properties (if any)...
    // "Meteor.settings" and "Meteor.settings.public" are set by default...
    let custom = {
        private: Meteor.settings.custom,
        public: Meteor.settings.public.custom
    };

    // ... and remove them to prevent clean up
    delete Meteor.settings.custom;
    delete Meteor.settings.public.custom;

    ServerConfiguration.clean(Meteor.settings);

    // TODO: Make the error messages more clear
    // Taking this out for now to prevent confusion.
    // check(Meteor.settings, ServerConfiguration);

    Meteor.settings.custom = custom.private;
    Meteor.settings.public.custom = custom.public;

    OHIF.log.info(JSON.stringify(Meteor.settings, null, 2));
});

// Check the servers on meteor startup
Meteor.startup(function() {
    OHIF.log.info('Updating servers information from JSON configuration');

    _.each(Meteor.settings.servers, function(endpoints, serverType) {
        _.each(endpoints, function(endpoint) {
            const server = _.clone(endpoint);
            server.origin = 'json';
            server.type = serverType;

            // Try to find a server with the same name/type/origin combination
            const existingServer = Servers.findOne({
                name: server.name,
                type: server.type,
                origin: server.origin
            });

            // Check if server was already added. Update it if so and insert if not
            if (existingServer) {
                Servers.update(existingServer._id, { $set: server });
            } else {
                Servers.insert(server);
            }
        });
    });

    OHIF.servers.control.resetCurrentServer();
});
