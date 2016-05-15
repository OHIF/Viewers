Template.serverInformationList.helpers({
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
        Meteor.call('removeServer', this._id, function(error) {
            if (error) {
                // TODO: check for errors: not-authorized, data-write
                console.log('>>>>ERROR', error);
            }
        });
    }
});
