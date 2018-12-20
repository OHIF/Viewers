import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';
import { Servers } from 'meteor/ohif:servers/both/collections';

// Check the servers on meteor startup
if (Meteor.settings &&
    Meteor.settings.public &&
    Meteor.settings.public.clientOnly !== true) {

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
}
