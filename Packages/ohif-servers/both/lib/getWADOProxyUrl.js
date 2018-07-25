import { OHIF } from 'meteor/ohif:core';

/**
 * @returns wado url for current server
 */
OHIF.servers.getWADOProxyUrl = () => {
    const server = OHIF.servers.getCurrentServer();

    //TODO: use WADOProxy to build the url using WADOProxy.Settings
    return `/__wado_proxy?url=${server.wadoRoot}/studies&serverId=${server._id}`;
}

