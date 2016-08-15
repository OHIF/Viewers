import { CurrentServer, Servers } from 'meteor/ohif:study-list/both/collections.js';
/**
 * Retrieves the current server configuration used to retrieve studies
 */
getCurrentServer = () => {
    const currentServer = CurrentServer.findOne();

    if (!currentServer) {
        return;
    }

    const serverConfiguration = Servers.findOne({ _id: currentServer.serverId });

    return serverConfiguration;
};
