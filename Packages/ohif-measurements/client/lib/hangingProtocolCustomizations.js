import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Viewerbase } from 'meteor/ohif:viewerbase';

// TODO: [LT-refactor] move this to ohif:hanging-protocols package
/**
 * Get a timepoint type for a given study metadata
 * @param  {StudyMetadata} study StudyMetadata instance
 * @return {String|undefined}    Timepoint type if found or undefined if not found or any error/missing information
 */
const getTimepointType = study => {
    const timepointApi = Template.instance().timepointApi;

    if (!timepointApi || !(study instanceof Viewerbase.metadata.StudyMetadata)) {
        return;
    }

    const timepoint = timepointApi.study(study.getStudyInstanceUID())[0];
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
