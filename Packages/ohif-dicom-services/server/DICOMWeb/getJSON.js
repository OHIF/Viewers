var http = Npm.require('http'), url = Npm.require('url');

function makeRequest(geturl, options, callback) {
    var parsed = url.parse(geturl), jsonHeaders = ['application/json', 'application/dicom+json'];
    
    var requestOpt = {
        hostname: parsed.hostname,
        port: parsed.port,
        headers: {
            Accept: 'application/json'
        },
        path: parsed.path,
        method: 'GET'
    };
    if (options.auth) {
        requestOpt.auth = options.auth;
    }

    var req = http.request(requestOpt, function(resp) {
        const contentType = (resp.headers['content-type'] || '').split(';')[0];

        if (jsonHeaders.indexOf(contentType) == -1) {
            const errorMessage = `We only support json but "${contentType}" was sent by the server`;
            callback(new Error(errorMessage), null);
            return;
        }

        var output = '';
        resp.setEncoding('utf8');
        resp.on('data', function(chunk){
          output += chunk;
        });
        resp.on('end', function(){
          callback(null, {data: JSON.parse(output)});
        });
    });
    req.end();
}
var makeRequestSync = Meteor.wrapAsync(makeRequest);

DICOMWeb.getJSON = function(geturl, options) {
    if (options.logRequests) {
        console.log(geturl);
    }

    if (options.logTiming) {
        console.time(geturl);
    }

    var result = makeRequestSync(geturl, options);

    if (options.logTiming) {
        console.timeEnd(geturl);
    }

    if (options.logResponses) {
        console.log(result);
    }

    return result;
};
