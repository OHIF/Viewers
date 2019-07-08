import Protocol from '../../classes/Protocol';

// The ProtocolStore class allows persisting hanging protocols using different strategies.
// For example, one strategy stores hanging protocols in the application server while
// another strategy stores them in a remote machine, but only one strategy can be used at a time.

export default class ProtocolStore {
  constructor(strategy) {
    this.strategy = strategy;
  }

  /**
   * Get a Protocol instance or array of Protocol instances for the given protocol object or array
   * @param  {Object|array} protocolObject Protocol plain object or array of Protocol plain objects
   * @return {Protocol|array} Protocol instance or array of Protocol intances for the given protocol object or array
   */
  static getProtocolInstance(protocolObject) {
    let result = protocolObject;

    // If result is an array of protocols objects
    if (result instanceof Array) {
      result.forEach((protocol, index) => {
        // Check if protocol is an instance of Protocol
        if (!(protocol instanceof Protocol)) {
          const protocolInstance = new Protocol();
          protocolInstance.fromObject(protocol);
          result[index] = protocolInstance;
        }
      });
    } else if (result !== void 0 && !(result instanceof Protocol)) {
      // Check if result exists and is not an instance of Protocol
      const protocolInstance = new Protocol();
      protocolInstance.fromObject(result);
      result = protocolInstance;
    }

    return result;
  }

  /**
   * Registers a function to be called when the protocol store is ready to persist hanging protocols
   *
   * NOTE: Strategies should implement this function
   *
   * @param callback The function to be called as a callback
   */
  onReady(callback) {
    this.strategy.onReady(callback);
  }

  /**
   * Gets the hanging protocol by protocolId if defined, otherwise all stored hanging protocols
   *
   * NOTE: Strategies should implement this function
   *
   * @param protocolId The protocol ID used to find the hanging protocol
   * @returns {object|array} The hanging protocol by protocolId or array of the stored hanging protocols
   */
  getProtocol(protocolId) {
    let result = this.strategy.getProtocol(protocolId);
    return ProtocolStore.getProtocolInstance(result);
  }

  /**
   * Stores the hanging protocol
   *
   * NOTE: Strategies should implement this function
   *
   * @param protocol The hanging protocol to be stored
   */
  addProtocol(protocol) {
    this.strategy.addProtocol(protocol);
  }

  /**
   * Updates the hanging protocol by protocolId
   *
   * NOTE: Strategies should implement this function
   *
   * @param protocolId The protocol ID used to find the hanging protocol to update
   * @param protocol The updated hanging protocol
   */
  updateProtocol(protocolId, protocol) {
    this.strategy.updateProtocol(protocolId, protocol);
  }

  /**
   * Removes the hanging protocol
   *
   * NOTE: Strategies should implement this function
   *
   * @param protocolId The protocol ID used to remove the hanging protocol
   */
  removeProtocol(protocolId) {
    this.strategy.removeProtocol(protocolId);
  }
}
