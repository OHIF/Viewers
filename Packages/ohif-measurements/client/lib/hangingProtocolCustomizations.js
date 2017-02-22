import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

const getTimepointType = study => {
    const instance = Template.instance();
    const timepointApi = instance.timepointApi || instance.data.timepointApi;
    if (!timepointApi) {
        return;
    }

    const timepoint = timepointApi.study(study.studyInstanceUid)[0];
    if (!timepoint) {
        return;
    }

    return timepoint.timepointType;
};

Meteor.startup(() => {
    HP = HP || false;

    if (HP) {
        HP.addCustomAttribute('timepointType', 'Timepoint Type', getTimepointType);
    }
});
