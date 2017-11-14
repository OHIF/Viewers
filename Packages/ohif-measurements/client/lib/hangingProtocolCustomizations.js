import { Meteor } from 'meteor/meteor';
import { Viewerbase } from 'meteor/ohif:viewerbase';
import { OHIF } from 'meteor/ohif:core';

const { InstanceMetadata, StudySummary } = Viewerbase.metadata;

// TODO: [LT-refactor] move this to ohif:hanging-protocols package
/**
 * Get a timepoint type for a given study metadata
 * @param  {StudyMetadata} study StudyMetadata instance
 * @return {String|undefined}    Timepoint type if found or undefined if not found or any error/missing information
 */
const getTimepointType = study => {
    const { timepointApi } = OHIF.viewer;

    if (!timepointApi || !(study instanceof InstanceMetadata || study instanceof StudySummary)) {
        return;
    }

    const timepoint = timepointApi.study(study.getStudyInstanceUID());
    if (!timepoint || !(timepoint instanceof Array) || timepoint.length < 1) {
        return;
    }

    return timepoint[0].timepointType;
};

/**
 * Get the timpoint key (prior/current/baseline) for a given study metadata
 * @param  {StudyMetadata} study StudyMetadata instance
 * @return {String|undefined} Timepoint key if found or undefined if not found or any error/missing information
 */
const getTimepointKey = study => {
    const { timepointApi } = OHIF.viewer;

    if (!timepointApi || !(study instanceof InstanceMetadata || study instanceof StudySummary)) {
        return;
    }

    const timepoint = timepointApi.study(study.getStudyInstanceUID());
    if (!timepoint || !(timepoint instanceof Array) || timepoint.length < 1) {
        return;
    }

    const timepointId = timepoint[0]._id;
    if (timepointApi.current()._id === timepointId) {
        return 'current';
    } else if (timepointApi.prior()._id === timepointId) {
        return 'prior';
    } else if (timepointApi.baseline()._id === timepointId) {
        return 'baseline';
    }
};

Meteor.startup(() => {
    HP = HP || false;

    if (HP) {
        HP.addCustomAttribute('timepointType', 'Timepoint Type', getTimepointType);
        HP.addCustomAttribute('timepointKey', 'Timepoint Key', getTimepointKey);
    }
});
