import ProtocolEngine from './ProtocolEngine.js';
import {
  ProtocolStore,
  ProtocolStrategy,
  LocalStorageProtocolStrategy,
  defaultProtocol,
  testProtocols,
} from './protocolStore';
import { addCustomAttribute } from './customAttributes';
import { addCustomViewportSetting } from './customViewportSettings';
import * as classes from './classes';

const hangingProtocols = {
  ProtocolEngine,
  ProtocolStore,
  ProtocolStrategy,
  LocalStorageProtocolStrategy,
  addCustomAttribute,
  addCustomViewportSetting,
  defaultProtocol,
  testProtocols,
  classes,
};

export default hangingProtocols;
