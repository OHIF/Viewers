import queryString from 'query-string';

WADOProxy.convertURL = (url, serverConfiguration) => {
    if (!url) {
        return null;
    }

    if (serverConfiguration.requestOptions &&
        serverConfiguration.requestOptions.requestFromBrowser === true) {
        return url;
    }

    const { settings } = WADOProxy;
    const serverId = serverConfiguration._id;
    const query = queryString.stringify({url, serverId});

    return `${settings.uri}?${query}`;
}
