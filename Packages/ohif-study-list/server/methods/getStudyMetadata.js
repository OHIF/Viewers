import { OHIF } from 'meteor/ohif:core';

Meteor.methods({
    /**
     * Retrieves Study metadata given a Study Instance UID
     * This Meteor method is available from both the client and the server
     */
    GetStudyMetadata: function(studyInstanceUid) {
        OHIF.log.info('GetStudyMetadata(%s)', studyInstanceUid);

        // Get the server data. This is user-defined in the config.json files or through servers
        // configuration modal
        const server = getCurrentServer();

        if (!server) {
            throw 'No properly configured server was available over DICOMWeb or DIMSE.';
        }

        if (server.type === 'dicomWeb') {
            return Services.WADO.RetrieveMetadata(server, studyInstanceUid);
        } else if (server.type === 'dimse') {
            return Services.DIMSE.RetrieveMetadata(studyInstanceUid);
        }
    }
});
