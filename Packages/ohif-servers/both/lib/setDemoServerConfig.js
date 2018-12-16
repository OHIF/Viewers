import { OHIF } from 'meteor/ohif:core';
import { Servers, CurrentServer } from 'meteor/ohif:servers/both/collections';

/**
 * Recreates a current server with GCloud config
 */
OHIF.servers.setDemoServerConfig = () => {
    CurrentServer.remove({});
    const demoServer = Servers.findOne({ name: "demo-dcm4chee" });
    if (!demoServer)
        throw new Error("demoServer is not found");
    CurrentServer.insert({
        serverId: demoServer._id
    });
};