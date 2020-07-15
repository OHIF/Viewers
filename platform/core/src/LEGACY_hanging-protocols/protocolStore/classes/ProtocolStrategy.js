import log from '../../../log';
import defaultProtocol from '../defaultProtocol';

export default class ProtocolStrategy {
  constructor() {
    this.hangingProtocols = new Map();
    this.defaultsAdded = false;
  }

  /**
   * Registers a function to be called when the hangingProtocols collection is subscribed
   * The callback is called only one time when the subscription is ready
   *
   * @param callback The function to be called as a callback
   */
  onReady(callback) {
    if (!this.defaultsAdded) {
      log.info('Inserting the default hanging protocol...');
      this.addProtocol(defaultProtocol);
      this.defaultsAdded = true;
    }

    callback();
  }

  /**
   * Gets the hanging protocol by protocolId if defined, otherwise all stored hanging protocols
   *
   * @param protocolId The protocol ID used to find the hanging protocol
   * @returns {object|array} The hanging protocol by protocolId or array of the stored hanging protocols
   */
  getProtocol(protocolId) {
    // Return the hanging protocol by protocolId if defined
    if (protocolId) {
      return this.hangingProtocols.get(protocolId);
    }

    // Otherwise, return all protocols
    return Array.from(this.hangingProtocols.values());
  }

  /**
   * Stores the hanging protocol
   *
   * @param protocol The hanging protocol to be stored
   */
  addProtocol(protocol) {
    this.hangingProtocols.set(protocol.id, protocol);
  }

  /**
   * Updates the hanging protocol by protocolId
   *
   * @param protocolId The protocol ID used to find the hanging protocol to update
   * @param protocol The updated hanging protocol
   */
  updateProtocol(protocolId, protocol) {
    if (!this.hangingProtocols.has(protocolId)) {
      return;
    }

    this.hangingProtocols.set(protocolId, protocol);
  }

  /**
   * Removes the hanging protocol
   *
   * @param protocolId The protocol ID used to remove the hanging protocol
   */
  removeProtocol(protocolId) {
    if (!this.hangingProtocols.has(protocolId)) {
      return;
    }

    this.hangingProtocols.delete(protocolId);
  }
}
