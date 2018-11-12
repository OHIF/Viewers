import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';
import { CurrentServer } from 'meteor/ohif:servers/both/collections';
import DIMSE from 'dimse';

const setupDIMSE = () => {
    // Terminate existing DIMSE servers and sockets and clean up the connection object
    DIMSE.connection.reset();

    // Get the new server configuration
    const server = OHIF.servers.getCurrentServer();

    // Stop here if the new server is not of DIMSE type
    if (server.type !== 'dimse') {
        return;
    }

    // Check if peers were defined in the server configuration and throw an error if not
    const peers = server.peers;
    if (!peers || !peers.length) {
        OHIF.log.error('dimse-config: ' + 'No DIMSE Peers provided.');
        throw new Meteor.Error('dimse-config', 'No DIMSE Peers provided.');
    }

    // Add all the DIMSE peers, establishing the connections
    OHIF.log.info('Adding DIMSE peers');
    try {
        peers.forEach(peer => DIMSE.connection.addPeer(peer));
    } catch(error) {
        OHIF.log.error('dimse-addPeers: ' + error);
        throw new Meteor.Error('dimse-addPeers', error);
    }
};

// Setup the DIMSE connections on startup or when the current server is changed
Meteor.startup(() => {
    CurrentServer.find().observe({
        added: setupDIMSE,
        changed: setupDIMSE
    });
});
