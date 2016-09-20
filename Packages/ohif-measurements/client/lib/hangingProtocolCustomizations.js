// TODO: [LT-refactor] move this to ohif:hanging-protocols package

getTimepointType = function(study) {
    const timepointApi = Template.instance().timepointApi;
    if (!timepointApi) {
        return;
    }

    const timepoint = timepointApi.study(study.studyInstanceUid)[0];
    if (!timepoint) {
        return;
    }

    return timepoint.timepointType;
};

HP = HP || false;

if (HP) {
    HP.addCustomAttribute('timepointType', 'Timepoint Type', getTimepointType);
}
