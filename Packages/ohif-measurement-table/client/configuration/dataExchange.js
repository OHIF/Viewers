import { OHIF } from 'meteor/ohif:core';
import { handleSR } from "../utils/handleSR";

const supportedSopClassUIDs = ['1.2.840.10008.5.1.4.1.1.88.22'];

export const retrieveMeasurements = (patientId, timepointIds) => {
    OHIF.log.info('retrieveMeasurements');

    const srSeries = [];
    const allStudies = OHIF.viewer.StudyMetadataList.all();
    allStudies.forEach(study => {
        study.getSeries().forEach(series => {
            const firstInstance = series.getFirstInstance();
            const sopClassUid = firstInstance._instance.sopClassUid;

            if (supportedSopClassUIDs.includes(sopClassUid)) {
                srSeries.push(series);
            }
        });
    });

    const promises = srSeries.map(handleSR);

    return Promise.all(promises).then((values) => {
        // Concatenate the measurements retrieved from each SR
        const combined = [].concat.apply([], [...values]);

        return {
            length: combined
        };
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
