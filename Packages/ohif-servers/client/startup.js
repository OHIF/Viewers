// Check the servers on meteor startup
import { Meteor } from "meteor/meteor";
import { Servers, CurrentServer } from 'meteor/ohif:servers/both/collections';

if (Meteor.settings &&
    Meteor.settings.public &&
    Meteor.settings.public.clientOnly === true &&
    Meteor.settings.public.servers) {
    OHIF.log.info('Updating servers information from JSON configuration');

    const servers = Meteor.settings.public.servers;

    Object.keys(servers).forEach((serverType) => {
        const endpoints = servers[serverType];
        endpoints.forEach((endpoint) => {
            const server = Object.assign({}, endpoint);
            server.type = serverType;

            Servers.insert(server);
        });
    });

    const newServer = Servers.findOne();

    CurrentServer.insert({
        serverId: newServer._id
    });
}

