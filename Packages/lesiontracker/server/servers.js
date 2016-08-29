import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

Meteor.startup(function() {
    _.each(Meteor.settings.servers, function(endpoints, serverType) {
        _.each(endpoints, function(endpoint) {
            var server = _.clone(endpoint);
            server.origin = 'json';
            server.type = serverType;
            Servers.insert(server);
        });
    });
});

class ServersControl {

    static validateUser() {
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }
    }

    static writeCallback(error, affected) {
        if (error) {
            throw new Meteor.Error('data-write', error);
        }
    }

    static save(serverSettings) {
        this.validateUser();
        var query = {
            _id: serverSettings._id
        };
        var options = {
            upsert: true
        };

        if (!serverSettings._id) {
            delete serverSettings._id;
        }

        return Servers.update(query, serverSettings, options, this.writeCallback);
    }

    static setActive(serverId) {
        this.validateUser();
        var query = {
            _id: Meteor.userId()
        };
        var data = {
            $set: {
                'profile.activeServer': serverId
            }
        };
        Accounts.users.update(query, data, this.writeCallback);
    }

    static remove(serverId) {
        this.validateUser();
        var query = {
            _id: serverId
        };
        return Servers.remove(query, this.writeCallback);
    }

}

Meteor.methods({
    serverSave: serverSettings => ServersControl.save(serverSettings),
    serverSetActive: serverId => ServersControl.setActive(serverId),
    serverRemove: serverId => ServersControl.remove(serverId)
});
