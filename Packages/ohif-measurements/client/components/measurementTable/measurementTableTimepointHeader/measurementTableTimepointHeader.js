Template.measurementTableTimepointHeader.helpers({
    'timepointName': function() {
        const timepoint = this;
        const instance = Template.instance();
        const timepointApi = instance.data.timepointApi;
        return timepointApi.name(timepoint);
    }
});