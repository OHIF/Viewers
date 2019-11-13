import {Meteor} from 'meteor/meteor';
import {OHIF} from 'meteor/ohif:core';
import {HTTP} from 'meteor/http';
import {Router} from 'meteor/iron:router';

Router.route('/instance/:instanceUid', function () {
    const response = this.response;
    const params = this.params;

    const Url = `http://localhost:8042/instances/${params.instanceUid}/file`;

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


// Router.route('/instance/:instanceUid', function () {
//     const request = this.request;
//     const response = this.response;
//     const params = this.params;
//
//     OHIF.log.info('Loading instance for instanceUid=%s',
//         params.instanceUid
//     );
//
//     let start = now();
//     let user;
//     if (doAuth) {
//         user = authenticateUser(request);
//         if (!user) {
//             response.writeHead(401);
//             response.end('Error: You must be logged in to perform this action.\n');
//             return;
//         }
//     }
//
//     let end = now();
//     const authenticationTime = end - start;
//
//     start = now();
//
//     const server = Servers.findOne(OHIF.servers.getCurrentServer());
//     if (!server) {
//         response.writeHead(500);
//         response.end('Error: No Server with the specified Server ID was found.\n');
//         return;
//     }
//
//     const requestOpt = server.requestOptions;
//
//     // If no Web Access to DICOM Objects (WADO) Service URL is provided
//     // return an error for the request.
//     debugger;
//     const Url = `http://localhost:8042/instances/${params.instanceUid}/file`;
//     OHIF.log.info('Url=%s', Url);
//     if (!Url) {
//         response.writeHead(500);
//         response.end('Error: No WADO URL was provided.\n');
//         return;
//     }
//
//     if (requestOpt.logRequests) {
//         console.log(request.url);
//     }
//
//     start = now();
//     if (requestOpt.logTiming) {
//         console.time(request.url);
//     }
//
//     // Use Node's URL parse to decode the query URL
//     const parsed = url.parse(Url);
//
//     // Create an object to hold the information required
//     // for the request to the PACS.
//     let options = {
//         headers: {},
//         method: request.method,
//         hostname: parsed.hostname,
//         path: parsed.path
//     };
//
//     let requester;
//     if (parsed.protocol === 'https:') {
//         requester = https.request;
//
//         options.agent = new https.Agent({rejectUnauthorized: false});
//     } else {
//         requester = http.request;
//     }
//
//     if (parsed.port) {
//         options.port = parsed.port;
//     }
//
//     Object.keys(request.headers).forEach(entry => {
//         const value = request.headers[entry];
//         if (entry) {
//             options.headers[entry] = value;
//         }
//     });
//
//     // Retrieve the authorization user:password string for the PACS,
//     // if one is required, and include it in the request to the PACS.
//     if (requestOpt.auth) {
//         options.auth = requestOpt.auth;
//     }
//
//     end = now();
//     const prepRequestTime = end - start;
//
//     // Use Node's HTTP API to send a request to the PACS
//     const proxyRequest = requester(options, proxyResponse => {
//         // When we receive data from the PACS, stream it as the
//         // response to the original request.
//         // console.log(`Got response: ${proxyResponse.statusCode}`);
//         end = now();
//         const proxyReqTime = end - start;
//         const totalProxyTime = authenticationTime + prepRequestTime + proxyReqTime;
//         proxyResponse.headers['Server-Timing'] = `
//             auth=${authenticationTime}; "Authenticate User",
//             prep-req=${prepRequestTime}; "Prepare Request Headers",
//             proxy-req=${proxyReqTime}; "Request to WADO URI",
//             total-proxy=${totalProxyTime}; "Total",
//         `.replace(/\n/g, '');
//
//         response.writeHead(proxyResponse.statusCode, proxyResponse.headers);
//
//         if (requestOpt.logTiming) {
//             console.timeEnd(request.url);
//         }
//
//         return proxyResponse.pipe(response, { end: true });
//     });
//
//     // If our request to the PACS fails, log the error message
//     proxyRequest.on('error', error => {
//         end = now();
//         const proxyReqTime = end - start;
//         const totalProxyTime = authenticationTime + prepRequestTime + proxyReqTime;
//         console.timeEnd(request.url);
//         const serverTimingHeaders = {
//             'Server-Timing': `
//                 auth=${authenticationTime}; "Authenticate User",
//                 prep-req=${prepRequestTime}; "Prepare Request Headers",
//                 proxy-req=${proxyReqTime}; "Request to WADO URI",
//                 total-proxy=${totalProxyTime}; "Total",
//             `.replace(/\n/g, '')
//         };
//
//         response.writeHead(500, serverTimingHeaders);
//         response.end(`Error: Problem with request to PACS: ${error.message}\n`);
//     });
//
//     // Stream the original request information into the request
//     // to the PACS
//     request.pipe(proxyRequest);
//
// }, {where: 'server'});

// Router.route('/study/:studyInstanceUid/serie/:serieInstanceUid/instance/:instanceUid', function() {
//     const request = this.request;
//     const response = this.response;
//     const params = this.params;
//
//     OHIF.log.info('Loading instance for study=%s, serie=%s, instance=%s',
//         params.studyInstanceUid,
//         params.serieInstanceUid,
//         params.instanceUid
//     );
//
//     let start = now();
//     let user;
//     if (doAuth) {
//         user = authenticateUser(request);
//         if (!user) {
//             response.writeHead(401);
//             response.end('Error: You must be logged in to perform this action.\n');
//             return;
//         }
//     }
//
//     let end = now();
//     const authenticationTime = end - start;
//
//     start = now();
//
//     const server = Servers.findOne(OHIF.servers.getCurrentServer());
//     if (!server) {
//         response.writeHead(500);
//         response.end('Error: No Server with the specified Server ID was found.\n');
//         return;
//     }
//
//     const requestOpt = server.requestOptions;
//
//     // If no Web Access to DICOM Objects (WADO) Service URL is provided
//     // return an error for the request.
//     const wadoUrl = `${server.wadoUriRoot}?requestType=WADO&studyUID=${params.studyInstanceUid}&seriesUID=${params.serieInstanceUid}&objectUID=${params.instanceUid}&contentType=application%2Fdicom`;
//     OHIF.log.info('WadoUrl=%s', wadoUrl);
//     if (!wadoUrl) {
//         response.writeHead(500);
//         response.end('Error: No WADO URL was provided.\n');
//         return;
//     }
//
//     if (requestOpt.logRequests) {
//         console.log(request.url);
//     }
//
//     start = now();
//     if (requestOpt.logTiming) {
//         console.time(request.url);
//     }
//
//     // Use Node's URL parse to decode the query URL
//     const parsed = url.parse(wadoUrl);
//
//     // Create an object to hold the information required
//     // for the request to the PACS.
//     let options = {
//         headers: {},
//         method: request.method,
//         hostname: parsed.hostname,
//         path: parsed.path
//     };
//
//     let requester;
//     if (parsed.protocol === 'https:') {
//         requester = https.request;
//
//         options.agent = new https.Agent({rejectUnauthorized: false});
//     } else {
//         requester = http.request;
//     }
//
//     if (parsed.port) {
//         options.port = parsed.port;
//     }
//
//     Object.keys(request.headers).forEach(entry => {
//         const value = request.headers[entry];
//         if (entry) {
//             options.headers[entry] = value;
//         }
//     });
//
//     // Retrieve the authorization user:password string for the PACS,
//     // if one is required, and include it in the request to the PACS.
//     if (requestOpt.auth) {
//         options.auth = requestOpt.auth;
//     }
//
//     end = now();
//     const prepRequestTime = end - start;
//
//     // Use Node's HTTP API to send a request to the PACS
//     const proxyRequest = requester(options, proxyResponse => {
//         // When we receive data from the PACS, stream it as the
//         // response to the original request.
//         // console.log(`Got response: ${proxyResponse.statusCode}`);
//         end = now();
//         const proxyReqTime = end - start;
//         const totalProxyTime = authenticationTime + prepRequestTime + proxyReqTime;
//         proxyResponse.headers['Server-Timing'] = `
//             auth=${authenticationTime}; "Authenticate User",
//             prep-req=${prepRequestTime}; "Prepare Request Headers",
//             proxy-req=${proxyReqTime}; "Request to WADO URI",
//             total-proxy=${totalProxyTime}; "Total",
//         `.replace(/\n/g, '');
//
//         response.writeHead(proxyResponse.statusCode, proxyResponse.headers);
//
//         if (requestOpt.logTiming) {
//             console.timeEnd(request.url);
//         }
//
//         return proxyResponse.pipe(response, { end: true });
//     });
//
//     // If our request to the PACS fails, log the error message
//     proxyRequest.on('error', error => {
//         end = now();
//         const proxyReqTime = end - start;
//         const totalProxyTime = authenticationTime + prepRequestTime + proxyReqTime;
//         console.timeEnd(request.url);
//         const serverTimingHeaders = {
//             'Server-Timing': `
//                 auth=${authenticationTime}; "Authenticate User",
//                 prep-req=${prepRequestTime}; "Prepare Request Headers",
//                 proxy-req=${proxyReqTime}; "Request to WADO URI",
//                 total-proxy=${totalProxyTime}; "Total",
//             `.replace(/\n/g, '')
//         };
//
//         response.writeHead(500, serverTimingHeaders);
//         response.end(`Error: Problem with request to PACS: ${error.message}\n`);
//     });
//
//     // Stream the original request information into the request
//     // to the PACS
//     request.pipe(proxyRequest);
// }, {where: 'server'});

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
                response.vtk = HTTP.get(url,
                    { headers: {
                            Accept: 'application/octet-stream'
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
