Template.serverInformationDicomWeb.onRendered(function() {
    var instance = Template.instance();
    instance.autorun(function() {
        var mode = instance.data.mode.get();
        if (mode === 'edit') {
            var data = instance.data.currentItem.get();
            FormUtils.setFormData(instance.data.$form, data);
        }
    });
});
