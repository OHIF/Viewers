Template.serverInformationModal.onCreated(function() {
    var instance = Template.instance();
    instance.container = {
        mode: new ReactiveVar('list'),
        serverType: new ReactiveVar(null),
        currentItem: new ReactiveVar(null),
        $form: null,
        resetState: function() {
            instance.container.mode.set('list');
            instance.container.serverType.set(null);
            instance.container.currentItem.set(null);
        }
    };
});

Template.serverInformationModal.events({
    'click .js-back, click [data-dismiss=modal]': function(event, instance) {
        instance.container.resetState();
    }
});
