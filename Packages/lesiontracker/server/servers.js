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

        var criteria = {
            _id: serverSettings._id
        };
        var options = {
            upsert: true
        };
        var callback = function(error, affected) {
            if (error) {
                throw new Meteor.Error('data-write', error);
            }

            console.log(Servers.findOne());
        };

        Servers.update(criteria, serverSettings, options, callback);
    }
});
