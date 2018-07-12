import { OHIF } from 'meteor/ohif:core';
import { handleSR, getLatestSRSeries } from "../utils/handleSR";

export const retrieveMeasurements = (patientId, timepointIds) => {
    OHIF.log.info('retrieveMeasurements');

    const latestSeries = getLatestSRSeries();

    return handleSR(latestSeries).then((value) => {
        return {
            length: value
        }
    });
};

export const storeMeasurements = (measurementData, timepointIds) => {
    OHIF.log.info('storeMeasurements');

    // Here is where we should do any required data transformation and API calls

    // TODO: Write SR, STOW back to PACS
    return Promise.resolve();
};

export const retrieveTimepoints = filter => {
    const studyInstanceUids = OHIF.viewer.StudyMetadataList.all().map(study => study.getStudyInstanceUID());
    OHIF.log.info('retrieveTimepoints');

    return Promise.resolve([{
        timepointType: 'baseline',
        timepointId: 'TimepointId',
        studyInstanceUids,
        patientId: filter.patientId,
        earliestDate: new Date(),
        latestDate: new Date(),
        isLocked: false
    }]);
};

export const storeTimepoints = (timepointData) => {
    OHIF.log.info('storeTimepoints');
    return Promise.resolve();
};

export const updateTimepoint = (timepointData, query) => {
    OHIF.log.info('updateTimepoint');
    return Promise.resolve();
};

export const removeTimepoint = timepointId => {
    OHIF.log.info('removeTimepoint');
    return Promise.resolve();
};

export const disassociateStudy = (timepointIds, studyInstanceUid) => {
    return Promise.resolve();
};
