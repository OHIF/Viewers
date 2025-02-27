import { Types } from '@ohif/core';

import { id } from './id';

import hpTestSwitch from './hpTestSwitch';

import getCustomizationModule from './getCustomizationModule';
import sameAs from './custom-attribute/sameAs';
import numberOfDisplaySets from './custom-attribute/numberOfDisplaySets';
import maxNumImageFrames from './custom-attribute/maxNumImageFrames';
import getPanelModule from './getPanelModule';

/**
 * The test extension provides additional behavior for testing various
 * customizations and settings for OHIF.
 */
const testExtension: Types.Extensions.Extension = {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id,

  /**
   * Register additional behavior:
   *   * HP custom attribute seriesDescriptions to retrieve an array of all series descriptions
   *   * HP custom attribute numberOfDisplaySets to retrieve the number of display sets
   *   * HP custom attribute numberOfDisplaySetsWithImages to retrieve the number of display sets containing images
   *   * HP custom attribute to return a boolean true, when the attribute sameAttribute has the same
   *     value as another series description in an already matched display set selector named with the value
   *     in `sameDisplaySetId`
   */
  preRegistration: ({ servicesManager }: Types.Extensions.ExtensionParams) => {
    const { hangingProtocolService } = servicesManager.services;
    hangingProtocolService.addCustomAttribute(
      'numberOfDisplaySets',
      'Number of displays sets',
      numberOfDisplaySets
    );
    hangingProtocolService.addCustomAttribute(
      'maxNumImageFrames',
      'Maximum of number of image frames',
      maxNumImageFrames
    );
    hangingProtocolService.addCustomAttribute(
      'sameAs',
      'Match an attribute in an existing display set',
      sameAs
    );
  },

  /** Registers some customizations */
  getCustomizationModule,

  getPanelModule,

  getHangingProtocolModule: () => {
    return [
      // Create a MxN hanging protocol available by default
      {
        name: hpTestSwitch.id,
        protocol: hpTestSwitch,
      },
    ];
  },
};

export default testExtension;
