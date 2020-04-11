import { ProtocolStrategy } from '.';

export default class LocalStorageProtocolStrategy extends ProtocolStrategy {
  constructor() {
    super();
    this.hangingProtocols = new Map(
      Object.entries(
        JSON.parse(localStorage.getItem('hanging-protocols') || '{}')
      )
    );
  }

  _save() {
    localStorage.setItem(
      'hanging-protocols',
      JSON.stringify(Object.fromEntries(this.hangingProtocols))
    );
  }
  addProtocol(protocol) {
    super.addProtocol(protocol);
    this._save();
  }
  updateProtocol(protocolId, protocol) {
    super.updateProtocol(protocolId, protocol);
    this._save();
  }
  removeProtocol(protocolId) {
    super.removeProtocol(protocolId);
    this._save();
  }
}
