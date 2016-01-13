DICOMWeb.getJSON = function(url, options) {
    var getOptions = {
        headers: {
            Accept: 'application/json'
        }
    };

    if (options.auth) {
        getOptions.auth = options.auth;
    }

    if (options.logRequests) {
        console.log(url);
    }

    if (options.logTiming) {
        console.time(url);
    }

    var result = HTTP.get(url, getOptions);

    if (options.logTiming) {
        console.timeEnd(url);
    }

    if (options.logResponses) {
        console.log(result.data);
    }

    return result;
};
