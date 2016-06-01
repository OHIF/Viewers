Meteor.methods({
    /**
     * Use the specified filter to conduct a search from the DICOM server
     * @param filter
     */
    WorklistSearch: function(filter) {
        if (Meteor.settings.servers.dicomWeb && Meteor.settings.defaultServiceType === 'dicomWeb') {
            // Get the server data. This is user-defined in the
            // config.json files used to run the Meteor server
            var server = Meteor.settings.servers.dicomWeb[0];

            return Services.QIDO.Studies(server, filter);
        } else if (Meteor.settings.servers.dimse && Meteor.settings.defaultServiceType === 'dimse') {
            return Services.DIMSE.Studies(filter);
        } else {
            throw 'No properly configured server was available over DICOMWeb or DIMSE.';
        }
    }
});
