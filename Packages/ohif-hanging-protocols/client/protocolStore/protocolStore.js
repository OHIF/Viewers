// The ProtocolStore module allows persisting hanging protocols using different strategies.
// For example, one strategy stores hanging protocols in the application server while
// another strategy stores them in a remote machine, but only one strategy can be used at a time.

HP.ProtocolStore = (function () {

    var strategy;

    /**
     * Sets the strategy used to persist hanging protocols
     *
     * @param preferredStrategy A preferred strategy will be using to persist hanging protocols
     */
    function setStrategy(preferredStrategy) {
        strategy = preferredStrategy;
    }

    /**
     * Registers a function to be called when the protocol store is ready to persist hanging protocols
     *
     * NOTE: Strategies should implement this function
     *
     * @param callback The function to be called as a callback
     */
    function onReady(callback) {
        strategy.onReady(callback);
    }

    /**
     * Gets the hanging protocol by protocolId if defined, otherwise all stored hanging protocols
     *
     * NOTE: Strategies should implement this function
     *
     * @param protocolId The protocol ID used to find the hanging protocol
     * @returns {object|array} The hanging protocol by protocolId or array of the stored hanging protocols
     */
    function getProtocol(protocolId) {
        return strategy.getProtocol(protocolId);
    }

    /**
     * Stores the hanging protocol
     *
     * NOTE: Strategies should implement this function
     *
     * @param protocol The hanging protocol to be stored
     */
    function addProtocol(protocol) {
        strategy.addProtocol(protocol);
    }

    /**
     * Updates the hanging protocol by protocolId
     *
     * NOTE: Strategies should implement this function
     *
     * @param protocolId The protocol ID used to find the hanging protocol to update
     * @param protocol The updated hanging protocol
     */
    function updateProtocol(protocolId, protocol) {
        strategy.updateProtocol(protocolId, protocol);
    }

    /**
     * Removes the hanging protocol
     *
     * NOTE: Strategies should implement this function
     *
     * @param protocolId The protocol ID used to remove the hanging protocol
     */
    function removeProtocol(protocolId) {
        strategy.removeProtocol(protocolId);
    }

    // Module Exports
    return {
        setStrategy: setStrategy,
        onReady: onReady,
        getProtocol: getProtocol,
        addProtocol: addProtocol,
        updateProtocol: updateProtocol,
        removeProtocol: removeProtocol
    };

})();
