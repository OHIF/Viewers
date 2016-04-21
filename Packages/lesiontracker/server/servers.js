Meteor.startup(function() {

    _.each(Meteor.settings.servers, function(endpoints, serverType) {
        _.each(endpoints, function(endpoint) {
            var server = _.clone(endpoint);
            server.origin = "json";
            server.type = serverType;
            Servers.insert(server);
        });
    });

});

Meteor.methods({
    addServer: function(serverSettings) {
        console.log("CHECKING PERMISSIONS");
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }
        console.log("WRITTING ON COLLECTION");
        Servers.update(
            { type: serverSettings.type, name: serverSettings.name },
            serverSettings,
            { upsert: true },
            function(error, affected) {
                console.log("CHECKING FOR ERRORS");
                if(error) throw new Meteor.Error('data-write', error);
                console.log("NO ERRORS, " + affected + " DOCUMENTS AFFECTED");
                console.log(Servers.findOne());
            }
        );
    }

});
