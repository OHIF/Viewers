import { OHIF } from 'meteor/ohif:core';

// Setup a Route using Iron Router to avoid Cross-origin resource sharing
// (CORS) errors. We only handle this route on the Server.
Router.route(Settings.uri.replace(OHIF.utils.absoluteUrl(), ''), function() {
    const request = this.request;
    const response = this.response;
    const params = this.params;
    const requestOptions = params.query.options ? JSON.parse(params.query.options) : {};

    // If no Web Access to DICOM Objects (WADO) Service URL is provided
    // return an error for the request.
    if (!params.query.url) {
        response.writeHead(500);
        response.end('Error: No WADO URL was provided.\n');
        return;
    }

    // Use Node's URL parse to decode the query URL
    const wadoUrl = url.parse(params.query.url);

    // Create an object to hold the information required
    // for the request to the PACS. 
    let options = {
        headers: {},
        method: request.method,
        hostname: wadoUrl.hostname,
        port: wadoUrl.port, //maybe null
        path: wadoUrl.path,
    };

    if (request.headers['referer']) {
        options.headers.referer = request.headers['referer'];
    }
    if (request.headers['user-agent']) {
        options.headers['user-agent'] = request.headers['user-agent'];
    }    

    // Retrieve the authorization user:password string for the PACS,
    // if one is required, and include it in the request to the PACS.
    //const wadoAuth = 'orthanc:orthanc'; 
    if (requestOptions.auth) {
        options.auth = requestOptions.auth;
    }

    // Use Node's HTTP API to send a request to the PACS
    const proxyRequest = http.request(options, (proxyResponse) => {
        // When we receive data from the PACS, stream it as the
        // response to the original request.
        // console.log(`Got response: ${proxyResponse.statusCode}`);
        response.writeHead(proxyResponse.statusCode, proxyResponse.headers);
        return proxyResponse.pipe(response, {end: true});
    });

    // If our request to the PACS fails, log the error message
    proxyRequest.on('error', (error) => {
        response.writeHead(500);
        response.end(`Error: Problem with request to PACS: ${error.message}\n`);
    });

    // Stream the original request information into the request
    // to the PACS
    request.pipe(proxyRequest);
}, {
    where: 'server'
});