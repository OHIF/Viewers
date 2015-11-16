Meteor.methods({
    /**
     * Use the specified filter to conduct a search from the DICOM server
     * @param filter
     */
    'WorklistSearch': function(filter) {
        // Get the server data. This is user-defined in the
        // config.json files used to run the Meteor server
        var server = Meteor.settings.dicomWeb.endpoints[0];

        return Services.QIDO.Studies(server, filter);
    }
});