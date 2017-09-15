import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';

Meteor.methods({
    /**
     * Use the specified filter to conduct a search from the DICOM server
     *
     * @param filter
     */
    StudyListSearch(filter) {
        // Get the server data. This is user-defined in the config.json files or through servers
        // configuration modal
        const server = OHIF.servers.getCurrentServer();

        if (!server) {
            throw new Meteor.Error('improper-server-config', 'No properly configured server was available over DICOMWeb or DIMSE.');
        }

        try {
            if (server.type === 'dicomWeb') {
                return Services.QIDO.Studies(server, filter);
            } else if (server.type === 'dimse') {
                return Services.DIMSE.Studies(filter);
            }
        } catch (error) {
            console.trace();

            throw error;
        }
    }
});
