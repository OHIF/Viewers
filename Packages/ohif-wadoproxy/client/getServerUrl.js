import { OHIF } from 'meteor/ohif:core';

/**
 * @returns wado url for current server
 */
WADOProxy.getServerUrl = () => {
    const server = OHIF.servers.getCurrentServer();
    const url = `${server.wadoRoot}/studies`;

    return WADOProxy.convertURL(url, server);
}
