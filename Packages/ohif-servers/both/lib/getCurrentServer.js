import { OHIF } from 'meteor/ohif:core';
import { Servers, CurrentServer } from 'meteor/ohif:servers/both/collections';

/**
 * Retrieves the current server configuration used to retrieve studies
 */
OHIF.servers.getCurrentServer = () => {
    const currentServer = CurrentServer.findOne();

    if (!currentServer) {
        return;
    }

    const serverConfiguration = Servers.findOne({ _id: currentServer.serverId });

    return serverConfiguration;
};
