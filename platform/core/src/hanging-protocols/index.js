import ProtocolEngine from './ProtocolEngine.js';
import { ProtocolStore, ProtocolStrategy } from './protocolStore';
import { addCustomAttribute } from './customAttributes';
import { addCustomViewportSetting } from './customViewportSettings';

const hangingProtocols = {
  ProtocolEngine,
  ProtocolStore,
  ProtocolStrategy,
  addCustomAttribute,
  addCustomViewportSetting,
};

export default hangingProtocols;
