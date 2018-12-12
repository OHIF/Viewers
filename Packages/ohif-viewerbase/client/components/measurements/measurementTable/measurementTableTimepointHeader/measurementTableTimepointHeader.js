import { Template } from 'meteor/templating';

Template.measurementTableTimepointHeader.helpers({
    timepointName(timepoint) {
        return Template.instance().data.timepointApi.name(timepoint);
    }
});
