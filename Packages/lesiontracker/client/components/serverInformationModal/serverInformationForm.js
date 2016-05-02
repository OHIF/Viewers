Template.serverInformationForm.events({
    'change .js-server-type': function(event, instance) {
      console.debug(instance);
        var value = $(event.currentTarget).val();
        instance.data.serverType.set(value);
    }
});
