const http = Npm.require('http');
const https = Npm.require('https');
const url = Npm.require('url');

function makeRequest(geturl, options, callback) {
    const parsed = url.parse(geturl);
    const jsonHeaders = ['application/json', 'application/dicom+json'];

    let requestOpt = {
        hostname: parsed.hostname,
        headers: {
            Accept: 'application/json'
        },
        path: parsed.path,
        method: 'GET'
    };

    let requester;
    if (parsed.protocol === 'https:') {
        requester = https.request;

        const allowUnauthorizedAgent = new https.Agent({ rejectUnauthorized: false });
        requestOpt.agent = allowUnauthorizedAgent
    } else {
        requester = http.request;
    }

    if (parsed.port) {
        requestOpt.port = parsed.port;
    }

    if (options.auth) {
        requestOpt.auth = options.auth;
    }

    if (options.headers) {
        Object.keys(options.headers).forEach(key => {
            const value = options.headers[key];
            requestOpt.headers[key] = value;
        });
    }

    const req = requester(requestOpt, function(resp) {
        const contentType = (resp.headers['content-type'] || '').split(';')[0];
        if (jsonHeaders.indexOf(contentType) == -1) {
            const errorMessage = `We only support json but "${contentType}" was sent by the server`;
            callback(new Error(errorMessage), null);
            return;
        }

        let output = '';

        resp.setEncoding('utf8');

        resp.on('data', function(chunk){
          output += chunk;
        });

        resp.on('error', function (responseError) {
            console.error('There was an error in the DICOMWeb Server')
            console.error(error.stack);
            console.trace();

            callback(new Meteor.Error('dicomweb-server-internal-error', responseError.message), null);
        });

        resp.on('end', function(){
          callback(null, {data: JSON.parse(output)});
        });
    });

    req.on('error', function (requestError) {
        console.error('Couldn\'t connect to DICOMWeb server.');
        console.error('Make sure you are trying to connect to the right server and that it is up and running.');
        console.error(requestError.stack);
        console.trace();

        callback(new Meteor.Error('dicomweb-server-connection-error', requestError.message), null);
    });

    req.end();
}
const makeRequestSync = Meteor.wrapAsync(makeRequest);

DICOMWeb.getJSON = function(geturl, options) {
    if (options.logRequests) {
        console.log(geturl);
    }

    if (options.logTiming) {
        console.time(geturl);
    }

    const result = makeRequestSync(geturl, options);

    if (options.logTiming) {
        console.timeEnd(geturl);
    }

    if (options.logResponses) {
        console.log(result);
    }

    return result;
};
