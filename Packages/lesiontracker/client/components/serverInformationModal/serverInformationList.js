Template.serverInformationList.onRendered(function() {
    var instance = Template.instance();
    instance.$('[data-toggle="tooltip"]').tooltip({ container: 'body' });
});

Template.serverInformationList.helpers({
    tooltipTop: function(title) {
        return {
            'data-toggle': 'tooltip',
            'data-placement': 'top',
            title: title
        };
    },
    servers: function() {
        return Servers.find().fetch();
    }
});

Template.serverInformationList.events({
    'click .addServer': function(event, instance) {
        instance.data.mode.set("create");
    },
    'click .editServer': function(event, instance) {
        instance.data.mode.set("edit");
    }
});
