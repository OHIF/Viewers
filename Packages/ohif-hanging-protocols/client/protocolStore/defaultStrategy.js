import { Meteor } from "meteor/meteor";
// The ProtocolStore default strategy is used to persist hanging protocols in
// the MongoDB collection 'HangingProtocols' in the application server.

var defaultStrategy = (function () {

    var hangingProtocolSubs;

    function addDefaultProtocols() {
        console.log('Inserting default protocols');

        addProtocol(HP.defaultProtocol);
    }

    function getDatabaseIdByProtocolId(protocolId) {
        const filteredProtocol = HangingProtocols.findOne({
            id: protocolId
        }, {
            fields: {
                _id: true
            }
        });

        if (!filteredProtocol) {
            return;
        }

        return filteredProtocol._id;
    }

    /**
     * Registers a function to be called when the hangingprotocols collection is subscribed
     * The callback is called only one time when the subscription is ready
     *
     * @param callback The function to be called as a callback
     */
    function onReady(callback) {
        if (hangingProtocolSubs && hangingProtocolSubs.ready()) {
            // It is already ready
            callback();
        } else {
            // Subscribe the hangingprotocols collection
            hangingProtocolSubs = Meteor.subscribe('hangingprotocols');

            // Wait for the subscription to be ready
            Tracker.autorun((computation) => {
                if (hangingProtocolSubs.ready()) {
                    computation.stop();
                    addDefaultProtocols();
                    callback();
                }
            });
        }
    }

    /**
     * Gets the hanging protocol by protocolId if defined, otherwise all stored hanging protocols
     *
     * @param protocolId The protocol ID used to find the hanging protocol
     * @returns {object|array} The hanging protocol by protocolId or array of the stored hanging protocols
     */
    function getProtocol(protocolId) {
        // Return the hanging protocol by protocolId if defined
        if (protocolId) {
            return HangingProtocols.findOne({
                id: protocolId
            });
        }

        // Otherwise, return all protocols
        return HangingProtocols.find().fetch();
    }

    /**
     * Stores the hanging protocol
     *
     * @param protocol The hanging protocol to be stored
     */
    function addProtocol(protocol) {
        // Collections can only be updated by database ID (_id) on client, so
        // get the database ID (_id) by the hanging protocol ID firstly
        const databaseId = getDatabaseIdByProtocolId(protocol.id);

        // Remove any MongoDB ID the protocol may have had
        delete protocol._id;

        // Update the protocol with the same id if exists instead of inserting this protocol
        if (databaseId) {
            // Update the hanging protocol by the database ID
            HangingProtocols.update(databaseId, {
                $set: protocol
            });

            return;
        }

        // Insert the protocol
        HangingProtocols.insert(protocol);
    }

    /**
     * Updates the hanging protocol by protocolId
     *
     * @param protocolId The protocol ID used to find the hanging protocol to update
     * @param protocol The updated hanging protocol
     */
    function updateProtocol(protocolId, protocol) {
        // Collections can only be updated by database ID (_id) on client, so
        // get the database ID (_id) by the hanging protocol ID firstly
        const databaseId = getDatabaseIdByProtocolId(protocolId);

        // Skip if it does not exist in database
        if (!databaseId) {
            return;
        }

        // Remove any MongoDB ID the protocol may have had
        delete protocol._id;

        // Update the hanging protocol by the database ID
        HangingProtocols.update(databaseId, {
            $set: protocol
        });
    }

    /**
     * Removes the hanging protocol
     *
     * @param protocolId The protocol ID used to remove the hanging protocol
     */
    function removeProtocol(protocolId) {
        // Collections can only be removed by database ID (_id) on client, so
        // get the database ID (_id) by the hanging protocol ID firstly
        const databaseId = getDatabaseIdByProtocolId(protocolId);

        // Skip if it does not exist in database
        if (!databaseId) {
            return;
        }

        // Remove the hanging protocol by the database ID
        HangingProtocols.remove(databaseId);
    }

    // Module Exports
    return {
        onReady: onReady,
        getProtocol: getProtocol,
        addProtocol: addProtocol,
        updateProtocol: updateProtocol,
        removeProtocol: removeProtocol
    };

})();

var clientOnlyStrategy = (function () {
    const HangingProtocols = new Mongo.Collection(null);

    let defaultsAdded = false;

    function addDefaultProtocols() {
        console.log('Inserting default protocols');

        addProtocol(HP.defaultProtocol);

        defaultsAdded = true;
    }

    function getDatabaseIdByProtocolId(protocolId) {
        const filteredProtocol = HangingProtocols.findOne({
            id: protocolId
        }, {
            fields: {
                _id: true
            }
        });

        if (!filteredProtocol) {
            return;
        }

        return filteredProtocol._id;
    }

    /**
     * Registers a function to be called when the hangingprotocols collection is subscribed
     * The callback is called only one time when the subscription is ready
     *
     * @param callback The function to be called as a callback
     */
    function onReady(callback) {
        if (!defaultsAdded) {
            addDefaultProtocols();
        }

        callback();
    }

    /**
     * Gets the hanging protocol by protocolId if defined, otherwise all stored hanging protocols
     *
     * @param protocolId The protocol ID used to find the hanging protocol
     * @returns {object|array} The hanging protocol by protocolId or array of the stored hanging protocols
     */
    function getProtocol(protocolId) {
        // Return the hanging protocol by protocolId if defined
        if (protocolId) {
            return HangingProtocols.findOne({
                id: protocolId
            });
        }

        // Otherwise, return all protocols
        return HangingProtocols.find().fetch();
    }

    /**
     * Stores the hanging protocol
     *
     * @param protocol The hanging protocol to be stored
     */
    function addProtocol(protocol) {
        // Collections can only be updated by database ID (_id) on client, so
        // get the database ID (_id) by the hanging protocol ID firstly
        const databaseId = getDatabaseIdByProtocolId(protocol.id);

        // Remove any MongoDB ID the protocol may have had
        delete protocol._id;

        // Update the protocol with the same id if exists instead of inserting this protocol
        if (databaseId) {
            // Update the hanging protocol by the database ID
            HangingProtocols.update(databaseId, {
                $set: protocol
            });

            return;
        }

        // Insert the protocol
        HangingProtocols.insert(protocol);
    }

    /**
     * Updates the hanging protocol by protocolId
     *
     * @param protocolId The protocol ID used to find the hanging protocol to update
     * @param protocol The updated hanging protocol
     */
    function updateProtocol(protocolId, protocol) {
        // Collections can only be updated by database ID (_id) on client, so
        // get the database ID (_id) by the hanging protocol ID firstly
        const databaseId = getDatabaseIdByProtocolId(protocolId);

        // Skip if it does not exist in database
        if (!databaseId) {
            return;
        }

        // Remove any MongoDB ID the protocol may have had
        delete protocol._id;

        // Update the hanging protocol by the database ID
        HangingProtocols.update(databaseId, {
            $set: protocol
        });
    }

    /**
     * Removes the hanging protocol
     *
     * @param protocolId The protocol ID used to remove the hanging protocol
     */
    function removeProtocol(protocolId) {
        // Collections can only be removed by database ID (_id) on client, so
        // get the database ID (_id) by the hanging protocol ID firstly
        const databaseId = getDatabaseIdByProtocolId(protocolId);

        // Skip if it does not exist in database
        if (!databaseId) {
            return;
        }

        // Remove the hanging protocol by the database ID
        HangingProtocols.remove(databaseId);
    }

    // Module Exports
    return {
        onReady: onReady,
        getProtocol: getProtocol,
        addProtocol: addProtocol,
        updateProtocol: updateProtocol,
        removeProtocol: removeProtocol
    };

})();

// If we are running a disconnect client similar to the StandaloneViewer
// (see https://docs.ohif.org/standalone-viewer/usage.html) we don't want
// our HangingProtocol strategy to try to use Meteor methods or Pub / Sub
if (Meteor.settings &&
    Meteor.settings.public &&
    Meteor.settings.public.clientOnly === true) {
    HP.ProtocolStore.setStrategy(clientOnlyStrategy);
} else {
    HP.ProtocolStore.setStrategy(defaultStrategy);
}

