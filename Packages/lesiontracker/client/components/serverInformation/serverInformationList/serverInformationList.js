Template.serverInformationList.helpers({
    isActive: function(server) {
        return server._id === Meteor.user().profile.activeServer;
    },
    servers: function() {
        return Servers.find().fetch();
    }
});

Template.serverInformationList.events({
    'click .js-add-server': function(event, instance) {
        instance.data.mode.set('create');
    },
    'click .js-edit-server': function(event, instance) {
        instance.data.currentItem.set(this);
        instance.data.mode.set('edit');
    },
    'click .js-remove-server': function(event, instance) {
        var id = this._id;
        Meteor.call('serverRemove', this._id, function(error) {
            // TODO: [custom-servers] check for errors: not-authorized, data-write
        });
    },
    'click .js-use-server': function(event, instance) {
        console.debug('>>>>clicked');
        var id = this._id;
        Meteor.call('serverSetActive', this._id, function(error) {
            // TODO: [custom-servers] check for errors: not-authorized, data-write
        });
    }
});
