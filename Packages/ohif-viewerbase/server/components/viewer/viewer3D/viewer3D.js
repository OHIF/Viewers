import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';
import { HTTP } from 'meteor/http';

Meteor.methods({
    RenderSerie: function (studyUid, serieUid) {
        let url;

        OHIF.log.info('GetVtk(study: %s, serie: %s)', studyUid, serieUid);
        const server = OHIF.servers.getCurrentServer();

        if (!server) {
            throw new Meteor.Error('improper-server-config', 'No properly configured server was available over DICOMWeb or DIMSE.');
        }

        try {
            if (server.type === 'dicomWeb') {
                url = server.vtkRoot + "/studies/" + studyUid + "/series/" + serieUid;
                return HTTP.get(url,
                    { headers: {
                            Accept: 'application/octet-stream'
                        }
                    });
            }
        } catch (error) {
            OHIF.log.trace();

            throw error;
        }
    }
});