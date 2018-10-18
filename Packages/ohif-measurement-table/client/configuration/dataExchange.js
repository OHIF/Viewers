import { OHIF } from 'meteor/ohif:core';
import { retrieveMeasurementFromSR, stowSRFromMeasurements } from '../utils/handleSR';
import { getLatestSRSeries } from '../utils/srUtils';

export const retrieveMeasurements = (patientId, timepointIds) => {
    OHIF.log.info('retrieveMeasurements');

    const latestSeries = getLatestSRSeries();

    if(!latestSeries) return Promise.resolve({});

    return retrieveMeasurementFromSR(latestSeries);
};

export const storeMeasurements = (measurementData, timepointIds) => {
    OHIF.log.info('storeMeasurements');

    const server = OHIF.servers.getCurrentServer();
    if (!server || server.type !== 'dicomWeb') {
        return Promise.resolve({});
    }

    const studyInstanceUid = measurementData[Object.keys(measurementData)[0]][0].studyInstanceUid

    return stowSRFromMeasurements(measurementData).then( () => {
        OHIF.studies.deleteStudyMetadataPromise(studyInstanceUid);
    }, error => {
        throw new Error(error);
    });
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
