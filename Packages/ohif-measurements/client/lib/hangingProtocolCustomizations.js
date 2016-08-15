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

const HP = HP || false;

if (HP) {
	HP.addCustomAttribute('timepointType', 'Timepoint Type', getTimepointType);	
}