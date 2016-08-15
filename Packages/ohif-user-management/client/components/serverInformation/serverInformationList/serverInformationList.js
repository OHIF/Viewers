Template.serverInformationList.onCreated(() => {
    const instance = Template.instance();

    instance.api = {
        add: () => instance.data.mode.set('create'),
        edit(server) {
            instance.data.currentItem.set(server);
            instance.data.mode.set('edit');
        },
        delete(server) {
            Meteor.call('serverRemove', server._id, error => {
                // TODO: check for errors: not-authorized, data-write
            });
        },
        use(server) {
            Meteor.call('serverSetActive', server._id, error => {
                // TODO: [custom-servers] check for errors: not-authorized, data-write
            });
        }
    };
});

Template.serverInformationList.helpers({
    isActive: function(server) {
        return server._id === Meteor.user().profile.activeServer;
    },
    servers: function() {
        return Servers.find().fetch();
    }
});
