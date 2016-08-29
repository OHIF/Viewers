WADOProxy = {};

WADOProxy.convertURL = (wadoURL, requestOptions) => {
    if (!Settings.enabled) {
        return wadoURL;
    }
    if (!wadoURL) {
        return null;
    }

    return Settings.uri + '?' + querystring.stringify({url: wadoURL, options: requestOptions ? JSON.stringify(requestOptions) : null});
}