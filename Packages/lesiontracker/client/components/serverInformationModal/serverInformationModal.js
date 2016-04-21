Template.serverInformationModal.onCreated(function() {
    var instance = Template.instance();
    instance.container = {
        mode: new ReactiveVar("list")
    };
});
