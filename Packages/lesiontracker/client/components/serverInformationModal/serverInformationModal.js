Template.serverInformationModal.onCreated(function() {
    var instance = Template.instance();
    instance.container = {
        mode: new ReactiveVar('list'),
        serverType: new ReactiveVar(null),
        currentItem: new ReactiveVar(null),
        $form: null
    };
});

Template.serverInformationModal.events({
    'click .js-back': function(event, instance) {
        var container = instance.container;
        container.mode.set('list');
        container.serverType.set(null);
    }
});
