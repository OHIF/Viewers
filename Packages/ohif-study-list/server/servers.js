import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';

Meteor.startup(function() {
    console.log('Adding Servers from JSON Configuration');
    Servers.remove({
        origin: 'json'
    });

    _.each(Meteor.settings.servers, function(endpoints, serverType) {
        _.each(endpoints, function(endpoint) {
            const server = _.clone(endpoint);
            server.origin = 'json';
            server.type = serverType;
            Servers.insert(server);
        });
    });

    ServersControl.resetCurrentServer();
});

class ServersControl {

    static writeCallback(error, affected) {
        if (error) {
            throw new Meteor.Error('data-write', error);
        }
    }

    static resetCurrentServer() {
        const currentServer = CurrentServer.findOne();
        if (currentServer && Servers.find({ _id: currentServer.serverId }).count()) {
            return;
        }

        const newServer = Servers.findOne({
            origin: 'json',
            type: Meteor.settings.defaultServiceType || 'dicomWeb'
        });

        if (newServer) {
            CurrentServer.remove({});
            CurrentServer.insert({
                serverId: newServer._id
            });
        }
    }

    static find(query) {
        return Servers.find(query).fetch();
    }

    static save(serverSettings) {
        const query = {
            _id: serverSettings._id
        };
        const options = {
            upsert: true
        };

        if (!serverSettings._id) {
            delete serverSettings._id;
        }

        return Servers.update(query, serverSettings, options, this.writeCallback);
    }

    static setActive(serverId) {
        CurrentServer.remove({});
        CurrentServer.insert({
            serverId: serverId
        });
    }

    static remove(serverId) {
        const query = {
            _id: serverId
        };

        const removeStatus = Servers.remove(query, this.writeCallback);

        ServersControl.resetCurrentServer();

        return removeStatus;
    }

}

Meteor.methods({
    serverFind: query => ServersControl.find(query),
    serverSave: serverSettings => ServersControl.save(serverSettings),
    serverSetActive: serverId => ServersControl.setActive(serverId),
    serverRemove: serverId => ServersControl.remove(serverId)
});
