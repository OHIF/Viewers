import { Meteor } from 'meteor/meteor';
import { Router } from 'meteor/iron:router';
import { OHIF } from 'meteor/ohif:core';

if (Meteor.isClient) {
    // Disconnect from the Meteor Server since we don't need it
    OHIF.log.info('Disconnecting from the Meteor server');
    Meteor.disconnect();

    Router.configure({
        loadingTemplate: 'loading'
    });

    Router.onBeforeAction('loading');

    Router.route('/:id', {
        action: function() {
            // Retrieve the ID from the URL the user has entered
            let id = this.params.id;

            if (!id) {
                id = 'testId';
            }

            // Define a request to the server to retrieve the study data
            // as JSON, given an ID that was in the Route
            const oReq = new XMLHttpRequest();

            // Add event listeners for request failure
            oReq.addEventListener('error', () => {
                OHIF.log.warn('An error occurred while retrieving the JSON data');
            });

            const self = this;

            // When the JSON has been returned, parse it into a JavaScript Object
            // and render the OHIF Viewer with this data
            oReq.addEventListener('load', function() {
                // Parse the response content
                // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseText
                if (!this.responseText) {
                    OHIF.log.warn('Response was undefined');
                    return;
                }

                OHIF.log.info(JSON.stringify(this.responseText, null, 2));

                const parsed = JSON.parse(this.responseText);

                // Create some data to pass to the OHIF Viewer
                const data = {
                    studies: parsed.studies,
                    contentId: 'standalone' // TODO: Remove all dependence on this
                };

                // Render the Viewer with this data
                self.render('standaloneViewer', {
                    data: function() {
                        return data;
                    }
                });
            });

            // Open the Request to the server for the JSON data
            // In this case we have a server-side route called /api/
            // which responds to GET requests with the study data
            OHIF.log.info(`Sending Request to: /api/${id}`);
            oReq.open('GET', `/api/${id}`);

            // Fire the request the server
            oReq.send();
            this.next();
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
