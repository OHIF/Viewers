import hpMN from './hpMN';

const hangingProtocols = [
  {
    name: '@ohif/hp-extension.mn',
    protocol: hpMN,
  },
];

/**
 * Registers a single study hanging protocol which can be referenced as
 * `@ohif/hp-exgtension.mn`, that has initial layouts which show images
 * only display sets, up to a 2x2 view.
 */
export default function getHangingProtocolModule() {
  return hangingProtocols;
}
