Meteor.methods({
    /**
     * Retrieves Study metadata given a Study Instance UID
     * This Meteor method is available from both the client and the server
     */
    GetStudyMetadata: function(studyInstanceUid) {
        log.info('GetStudyMetadata(%s)', studyInstanceUid);

        if (!Meteor.settings.servers.dicomWeb) {
            throw 'No properly configured server was available over DICOMWeb';
        }

        if (Meteor.settings.servers.dicomWeb && Meteor.settings.defaultServiceType === 'dicomWeb') {
            // Get the server data. This is user-defined in the
            // config.json files used to run the Meteor server
            var server = Meteor.settings.servers.dicomWeb[0];
            return Services.WADO.RetrieveMetadata(server, studyInstanceUid);
        } else if (Meteor.settings.servers.dimse && Meteor.settings.defaultServiceType === 'dimse') {
            return Services.DIMSE.RetrieveMetadata(studyInstanceUid);
        }
    }
});
