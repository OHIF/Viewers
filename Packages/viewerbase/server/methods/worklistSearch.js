Meteor.methods({
    /**
     * Use the specified filter to conduct a search from the DICOM server
     * @param filter
     */
    'WorklistSearch': function(filter) {
        if (!Meteor.settings.dicomWeb) {
            console.warn('No dicomWeb settings provided! Worklist search is not possible!')
            return;
        }
        
        // Get the server data. This is user-defined in the
        // config.json files used to run the Meteor server
        var server = Meteor.settings.dicomWeb.endpoints[0];

        return Services.QIDO.Studies(server, filter);
    }
});