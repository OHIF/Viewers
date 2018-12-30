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
            var response = {
                vtk: undefined,
                instances: undefined
            };
            if (server.type === 'dicomWeb') {
                url = server.vtkRoot + "/studies/" + studyUid + "/series/" + serieUid;
                OHIF.log.info('URL: %s', url);
                Object.assign(response.vtk, HTTP.get(url,
                    { headers: {
                            Accept: 'application/octet-stream'
                        }
                    }));

                debugger;
                url = server.wadoRoot + "/studies/" + studyUid + "/series/" + serieUid + "/instances";
                let instances = HTTP.get(url,
                    { headers: {
                            Accept: "application/json"
                        }
                    });

                const urls = instances.content.map( instance => {
                    const sopInstanceUid = instance['00080018'].value;
                    // Retrieve the actual data over WADO-URI
                    const server = OHIF.servers.getCurrentServer();
                    const wadouri = `${server.wadoUriRoot}?requestType=WADO&studyUID=${studyUid}&seriesUID=${serieUid}&objectUID=${sopInstanceUid}&contentType=application%2Fdicom`;
                    return WADOProxy.convertURL(wadouri, server);
                });
                Object.assign(response.instances, urls);

                return response;
            }
        } catch (error) {
            OHIF.log.trace();

            throw error;
        }
    }
});