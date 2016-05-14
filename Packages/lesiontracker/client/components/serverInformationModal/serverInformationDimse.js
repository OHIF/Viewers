Template.serverInformationDimse.onCreated(function() {
    var instance = Template.instance();
    instance.peers = new ReactiveVar([]);
    instance.autorun(function() {
        var currentItem = instance.data.currentItem.get();
        instance.peers.set(currentItem.peers || []);
    });
});

Template.serverInformationDimse.onRendered(function() {
    var instance = Template.instance();
    instance.autorun(function() {
        var mode = instance.data.mode.get();
        if (mode === 'edit') {
            var data = instance.data.currentItem.get();
            FormUtils.setFormData(instance.data.$form, data);
        }
    });
});

Template.serverInformationDimse.events({
    'click .js-new-peer': function(event, instance) {
        event.preventDefault();
        var peers = instance.peers.get();
        peers.push({});
        instance.peers.set(peers);
    }
});
