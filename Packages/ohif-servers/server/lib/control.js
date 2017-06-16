import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';
import { Servers, CurrentServer } from 'meteor/ohif:servers/both/collections';

OHIF.servers.control = {
    writeCallback(error, affected) {
        if (error) {
            throw new Meteor.Error('data-write', error);
        }
    },

    resetCurrentServer() {
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
    },

    find(query) {
        return Servers.find(query).fetch();
    },

    save(serverSettings) {
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
    },

    setActive(serverId) {
        CurrentServer.remove({});
        CurrentServer.insert({
            serverId: serverId
        });
    },

    remove(serverId) {
        const query = {
            _id: serverId
        };

        const removeStatus = Servers.remove(query, this.writeCallback);

        OHIF.servers.control.resetCurrentServer();

        return removeStatus;
    }
};
