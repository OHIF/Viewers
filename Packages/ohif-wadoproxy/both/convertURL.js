import queryString from 'query-string';

WADOProxy.convertURL = (url, serverConfiguration) => {
    const { settings } = WADOProxy;

    if (!settings.enabled) {
        return url;
    }

    if (!url) {
        return null;
    }

    const serverId = serverConfiguration._id;
    const query = queryString.stringify({url, serverId});
    return `${settings.uri}?${query}`;
}
