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

Meteor.methods({

    saveServer: function(serverSettings) {
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        var query = {
            _id: serverSettings._id
        };
        var options = {
            upsert: true
        };

        if (!serverSettings._id) {
            delete serverSettings._id;
        }

        var callback = function(error, affected) {
            if (error) {
                throw new Meteor.Error('data-write', error);
            }

        };

        Servers.update(query, serverSettings, options, callback);
    },

    removeServer: function(serverId) {
        var query = {
            _id: serverId
        };
        Servers.remove(query, true);
    }

});
