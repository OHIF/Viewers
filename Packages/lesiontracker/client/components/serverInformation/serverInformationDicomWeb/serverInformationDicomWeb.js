Template.serverInformationDicomWeb.onRendered(function() {
    var instance = Template.instance();
    instance.autorun(function() {
        const mode = instance.data.mode.get();
        if (mode === 'edit') {
            const data = instance.data.currentItem.get();
            instance.data.form.value(data);
        }
    });
});
