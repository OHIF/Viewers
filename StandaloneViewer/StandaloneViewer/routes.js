import { Meteor } from 'meteor/meteor';
import { Router } from 'meteor/clinical:router';
import { OHIF } from 'meteor/ohif:core';

if (Meteor.isClient) {
    // Disconnect from the Meteor Server since we don't need it
    OHIF.log.info('Disconnecting from the Meteor server');
    Meteor.disconnect();

    Router.configure({
        loadingTemplate: 'loading'
    });

    Router.onBeforeAction('loading');

    Router.route('/:id?', {
        onRun: function() {
            console.warn('onRun');
            // Retrieve the query from the URL the user has entered
            const query = this.params.query;
            const id = this.params.id;

            if (!id && !query.url) {
                console.log('No URL was specified. Use ?url=${yourURL}');
                return;
            }

            const next = this.next;
            const idUrl = `/api/${id}`;
            const url = query.url || idUrl;

            // Define a request to the server to retrieve the study data
            // as JSON, given a URL that was in the Route
            const oReq = new XMLHttpRequest();

            // Add event listeners for request failure
            oReq.addEventListener('error', () => {
                OHIF.log.warn('An error occurred while retrieving the JSON data');
                next();
            });

            // When the JSON has been returned, parse it into a JavaScript Object
            // and render the OHIF Viewer with this data
            oReq.addEventListener('load', () => {
                // Parse the response content
                // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseText
                if (!oReq.responseText) {
                    OHIF.log.warn('Response was undefined');
                    return;
                }

                OHIF.log.info(JSON.stringify(oReq.responseText, null, 2));
                this.data = JSON.parse(oReq.responseText);

                if (this.data.servers && query.studyInstanceUids) {
                    console.warn('Using Server Definition!');

                    const server = this.data.servers.dicomWeb[0];
                    server.type = 'dicomWeb';

                    const serverId = OHIF.servers.collections.servers.insert(server);

                    OHIF.servers.collections.currentServer.insert({
                        serverId
                    });

                    studyInstanceUids = query.studyInstanceUids.split(';');
                    const seriesInstanceUids = [];

                    const viewerData = {
                        studyInstanceUids,
                        seriesInstanceUids
                    };

                    OHIF.studies.retrieveStudiesMetadata(studyInstanceUids, seriesInstanceUids).then(studies => {
                        this.data = {
                            studies,
                            viewerData
                        };

                        next();
                    });

                    return;
                }

                next();
            });

            // Open the Request to the server for the JSON data
            // In this case we have a server-side route called /api/
            // which responds to GET requests with the study data
            OHIF.log.info(`Sending Request to: ${url}`);
            oReq.open('GET', url);
            oReq.setRequestHeader('Accept', 'application/json')

            // Fire the request to the server
            oReq.send();
        },
        action() {
            // Render the Viewer with this data
            this.render('standaloneViewer', {
                data: () => this.data
            });
        }
    });
}

// This is ONLY for demo purposes.
if (Meteor.isServer) {
    // You can test this with:
    // curl -v -H "Content-Type: application/json" -X GET 'http://localhost:3000/getData/testId'
    //
    // Or by going to:
    // http://localhost:3000/api/testId

    Router.route('/api/:id', { where: 'server' }).get(function() {
        // "this" is the RouteController instance.
        // "this.response" is the Connect response object
        // "this.request" is the Connect request object
        const id = this.params.id;

        // Find the relevant study data from the Collection given the ID
        const data = RequestStudies.findOne({ transactionId: id });

        // Set the response headers to return JSON to any server
        this.response.setHeader('Content-Type', 'application/json');
        this.response.setHeader('Access-Control-Allow-Origin', '*');
        this.response.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

        // Change the response text depending on the available study data
        if (!data) {
            this.response.write('No Data Found');
        } else {
            // Stringify the JavaScript object to JSON for the response
            this.response.write(JSON.stringify(data));
        }

        // Finalize the response
        this.response.end();
    });
}
