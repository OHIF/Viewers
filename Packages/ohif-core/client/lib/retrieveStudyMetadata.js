import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';

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
        }
    });

    // Store the promise in cache
    StudyMetaDataPromises.set(studyInstanceUid, promise);

    return promise;
};
