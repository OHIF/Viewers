import { MeasurementApi } from 'meteor/lesiontracker/client/api/measurement';

Template.lesionTableView.helpers({
    targets() {
        const withPriors = true;
        return MeasurementApi.targets(withPriors);
    },

    nonTargets() {
        const withPriors = true;
        return MeasurementApi.nonTargets(withPriors);
    },

    newLesions() {
        return MeasurementApi.newLesions();
    },

    isFollowup() {
        const instance = Template.instance();
        const current = instance.data.timepointApi.current();
        return (current && current.timepointType === 'followup');
    }
});
