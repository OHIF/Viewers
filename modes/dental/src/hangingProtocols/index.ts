import hp2x2Dental from './hp2x2Dental';

/**
 * Dental Hanging Protocol Module
 *
 * Provides hanging protocols specifically designed for dental imaging workflows.
 * These protocols are optimized for dental modalities (DX, PX, IO) and common
 * dental examination patterns.
 */
const hangingProtocols = [
  {
    name: hp2x2Dental.id,
    protocol: hp2x2Dental,
  },
];

/**
 * Returns the hanging protocol module for dental mode
 * This will be registered with OHIF's hanging protocol service
 */
function getHangingProtocolModule() {
  return hangingProtocols;
}

export default getHangingProtocolModule;
