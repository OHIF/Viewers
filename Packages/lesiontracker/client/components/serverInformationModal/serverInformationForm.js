Template.serverInformationForm.onRendered(function() {
    var instance = Template.instance();

    instance.data.$form = instance.$('form');
    instance.autorun(function() {
        var mode = instance.data.mode.get();
        if (mode === 'edit') {
            var data = instance.data.currentItem.get();
            FormUtils.setFormData(instance.data.$form, data);
        }
    });
});

Template.serverInformationForm.events({
    'change .js-server-type': function(event, instance) {
        var value = $(event.currentTarget).val();
        instance.data.serverType.set(value);
    },
    submit: function(event, instance) {
        event.preventDefault();
        var formData = FormUtils.getFormData(instance.data.$form);
        Meteor.call('saveServer', formData, function(error) {
            if (error) {
                // TODO: check for errors: not-authorized, data-write
                console.log('>>>>ERROR', error);
            }

            instance.data.mode.set('list');
        });
    }
});
