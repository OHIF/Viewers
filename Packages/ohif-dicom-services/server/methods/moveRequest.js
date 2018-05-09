import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';

Meteor.methods({
    MoveRequest(options) {
        // Get the server data. This is user-defined in the config.json files or through servers
        // configuration modal
        const server = OHIF.servers.getCurrentServer();

        if (!server) {
            throw new Meteor.Error('improper-server-config', 'No properly configured server was available over DICOMWeb or DIMSE.');
        }

        try {
            if (server.type === 'dimse') {
                console.log("*** Move request, called DIMSE with option *** ", options)

                return DIMSE.moveInstances(options);
            } else {
                throw new Meteor.Error('improper-server-config', 'Server is not DIMSE. Must be DIMSE for C-MOVE to work')
            }
        } catch (error) {
            OHIF.log.error(error);
            OHIF.log.trace();
        }
    },
});