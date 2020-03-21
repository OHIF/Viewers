import {Meteor} from 'meteor/meteor';
import {OHIF} from 'meteor/ohif:core';
import {HTTP} from 'meteor/http';
import {Router} from 'meteor/iron:router';

Router.route('/instance/:instanceUid', function () {
    const response = this.response;
    const params = this.params;

    const server = OHIF.servers.getCurrentServer();

    const Url = server.instancesRoot + `/${params.instanceUid}/file`;

    //const Url = `http://localhost:8042/instances/${params.instanceUid}/file`;

    HTTP.get(Url,
        { npmRequestOptions: {
                encoding: null
            }
        }, (error, result) => {
            if (!error) {
                response.writeHead(result.statusCode, result.headers);
                response.end(result.content);
                return;
            }

            response.writeHead(500);
            response.end(error.stack);

        });

}, {where: 'server'});

Meteor.methods({
    RenderSerie: function (studyUid, serieUid, pipelineId) {
        let url;

        OHIF.log.info('GetVtk(study: %s, serie: %s, pipeline: %s)', studyUid, serieUid, pipelineId);
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
                url = server.vtkRoot + "/study/" + studyUid + "/serie/" + serieUid + "/pipeline/" + pipelineId;
                OHIF.log.info('URL: %s', url);
                response.vtk = HTTP.get(url,
                    {
                        headers: {
                            Accept: 'application/octet-stream'
                        },
                        npmRequestOptions: {
                            encoding: null
                        }
                    });

                url = "http://localhost:8042" + "/tools/find/";
                let instances = HTTP.post(url,
                    { data: {
                            "Level": "Instance",
                            "Query": {
                                "SeriesInstanceUID": serieUid,
                                "StudyInstanceUID": studyUid
                            }
                        }
                    });

                response.instances = JSON.parse(instances.content).map(instance => {
                    return `/instance/${instance}`;
                    // return `http://localhost:8042/instances/${instance}/file`;
                });

                return response;
            }
        } catch (error) {
            OHIF.log.trace();

            throw error;
        }
    }
});
