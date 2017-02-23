import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Viewerbase } from 'meteor/ohif:viewerbase';

const { InstanceMetadata, StudySummary } = Viewerbase.metadata;

// TODO: [LT-refactor] move this to ohif:hanging-protocols package
/**
 * Get a timepoint type for a given study metadata
 * @param  {StudyMetadata} study StudyMetadata instance
 * @return {String|undefined}    Timepoint type if found or undefined if not found or any error/missing information
 */
const getTimepointType = study => {
    const timepointApi = OHIF.viewer.timepointApi;

    if (!timepointApi || !(study instanceof InstanceMetadata || study instanceof StudySummary) ) {
        return;
    }

    const timepoint = timepointApi.study(study.getStudyInstanceUID());
    if (!timepoint || !(timepoint instanceof Array) || timepoint.length < 1) {
        return;
    }

    return timepoint[0].timepointType;
};

Meteor.startup(() => {
    HP = HP || false;

    if (HP) {
        HP.addCustomAttribute('timepointType', 'Timepoint Type', getTimepointType);
    }
});
