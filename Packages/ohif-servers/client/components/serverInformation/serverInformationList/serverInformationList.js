import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Servers, CurrentServer } from 'meteor/ohif:servers/both/collections';

Template.serverInformationList.onCreated(() => {
    const instance = Template.instance();

    instance.api = {
        add: () => instance.data.mode.set('create'),

        edit(server) {
            instance.data.currentItem.set(server);
            instance.data.mode.set('edit');
        },

        delete(server) {
            // TODO: Replace this for confirmation dialog after LT-refactor is merged back to master
            if (!window.confirm('Are you sure you want to remove this peer?')) {
                return;
            }

            Meteor.call('serverRemove', server._id, error => {
                // TODO: check for errors: data-write
            });
        },

        use(server) {
            Meteor.call('serverSetActive', server._id, error => {
                // TODO: check for errors: data-write
            });
        }
    };
});

Template.serverInformationList.helpers({
    isActive: function(server) {
        const currentServer = CurrentServer.findOne();
        if (!currentServer) {
            return;
        }

        return server._id === currentServer.serverId;
    },
    servers: function() {
        const options = {
            sort: {
                origin: -1,
                type: 1,
                name: 1
            }
        };
        return Servers.find({}, options).fetch();
    }
});
