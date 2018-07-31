import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';
import 'meteor/ohif:viewerbase';

// Define the StudyMetaDataPromises object. This is used as a cache to store study meta data
// promises and prevent unnecessary subsequent calls to the server
const StudyMetaDataPromises = new Map();


/**
 * Delete the cached study metadata retrieval promise to ensure that the browser will 
 * re-retrieve the study metadata when it is next requested
 *
 * @param {String} studyInstanceUid The UID of the Study to be removed from cache
 * 
 */
OHIF.studies.deleteStudyMetadataPromise = (studyInstanceUid) => {
    if (StudyMetaDataPromises.has(studyInstanceUid)) {
        StudyMetaDataPromises.delete(studyInstanceUid);
    }
};

/**
 * Retrieves study metadata using a server call
 *
 * @param {String} studyInstanceUid The UID of the Study to be retrieved
 * @returns {Promise} that will be resolved with the metadata or rejected with the error
 */
OHIF.studies.retrieveStudyMetadata = (studyInstanceUid, seriesInstanceUids) => {

    // @TODO: Whenever a study metadata request has failed, its related promise will be rejected once and for all
    // and further requests for that metadata will always fail. On failure, we probably need to remove the
    // corresponding promise from the "StudyMetaDataPromises" map...

    // If the StudyMetaDataPromises cache already has a pending or resolved promise related to the
    // given studyInstanceUid, then that promise is returned
    if (StudyMetaDataPromises.has(studyInstanceUid)) {
        return StudyMetaDataPromises.get(studyInstanceUid);
    }

    const seriesKeys = Array.isArray(seriesInstanceUids) ? '|' + seriesInstanceUids.join('|') : '';
    const timingKey = `retrieveStudyMetadata[${studyInstanceUid}${seriesKeys}]`;
    OHIF.log.time(timingKey);

    // Create a promise to handle the data retrieval
    const promise = new Promise((resolve, reject) => {
        const server = OHIF.servers.getCurrentServer();

        // If no study metadata is in the cache variable, we need to retrieve it from
        // the server with a call.
        if (server.type === 'dicomWeb' && server.requestOptions.requestFromBrowser === true) {
            OHIF.studies.services.WADO.RetrieveMetadata(server, studyInstanceUid).then(function (data) {
                resolve(data)
            }, reject);
        } else {
            Meteor.call('GetStudyMetadata', studyInstanceUid, function (error, study) {
                OHIF.log.timeEnd(timingKey);

                if (error) {
                    const errorType = error.error;
                    let errorMessage = '';

                    if (errorType === 'server-connection-error') {
                        errorMessage = 'There was an error connecting to the DICOM server, please verify if it is up and running.';
                    } else if (errorType === 'server-internal-error') {
                        errorMessage = `There was an internal error with the DICOM server getting metadeta for ${studyInstanceUid}`;
                    } else {
                        errorMessage = `For some reason we could not retrieve the study\'s metadata for ${studyInstanceUid}.`;
                    }

                    OHIF.log.error(errorMessage);
                    OHIF.log.error(error.stack);
                    reject(`GetStudyMetadata: ${errorMessage}`);
                    return;
                }

                // Filter series if seriesInstanceUid exists
                if (seriesInstanceUids && seriesInstanceUids.length) {
                    study.seriesList = study.seriesList.filter(series => seriesInstanceUids.indexOf(series.seriesInstanceUid) > -1);
                }

                if (!study) {
                    reject(`GetStudyMetadata: No study data returned from server: ${studyInstanceUid}`);
                    return;
                }

                // Resolve the promise with the final study metadata object
                resolve(study);
            });
        }
    });

    // Store the promise in cache
    StudyMetaDataPromises.set(studyInstanceUid, promise);

    return promise;
};
