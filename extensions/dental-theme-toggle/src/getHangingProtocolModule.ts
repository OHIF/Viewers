import hp2x2Dental from './hangingProtocols/hp2x2Dental';

/**
 * Dental Hanging Protocol Module
 *
 * Provides hanging protocols specifically designed for dental imaging workflows.
 * These protocols are optimized for dental modalities (DX, PX, IO) and common
 * dental examination patterns.
 */
function getHangingProtocolModule() {
  return [
    {
      name: hp2x2Dental.id,
      protocol: hp2x2Dental,
    },
  ];
}

export default getHangingProtocolModule;
