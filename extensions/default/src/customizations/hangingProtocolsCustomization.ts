import { hpMN, hpMN8 } from '../hangingprotocols/hpMNGrid';

/**
 * The grid protocols as `hangingProtocols.<id>` customizations, so that a
 * `?customization=` JSONC file can change one with `$merge`, or replace it
 * with `$set`. The `hangingProtocolService` reads the customization in place of
 * the protocol that `getHangingProtocolModule` registers.
 *
 * `hpMN8` copies the stages of `hpMN` in code, so a change to the mnGrid
 * customization does not change mnGrid8.
 */
export default {
  [`hangingProtocols.${hpMN.id}`]: hpMN,
  [`hangingProtocols.${hpMN8.id}`]: hpMN8,
};
