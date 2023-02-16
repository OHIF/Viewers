import { Types } from '@ohif/core';

import { id } from './id';

import getHangingProtocolModule from './hp';
// import {setViewportZoomPan, storeViewportZoomPan } from './custom-viewport/setViewportZoomPan';
import sameAs from './custom-attribute/sameAs';
import numberOfDisplaySets from './custom-attribute/numberOfDisplaySets';
import numberOfDisplaySetsWithImages from './custom-attribute/numberOfDisplaySetsWithImages';
import maxNumImageFrames from './custom-attribute/maxNumImageFrames';
import seriesDescriptionsFromDisplaySets from './custom-attribute/seriesDescriptionsFromDisplaySets';

/**
 * The test extension provides additional behaviour for testing various
 * customizations and settings for OHIF.
 */
const testExtension: Types.Extensions.Extension = {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id,

  /** Register additional behaviour:
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
      'seriesDescriptions',
      'Series Descriptions',
      seriesDescriptionsFromDisplaySets
    );
    hangingProtocolService.addCustomAttribute(
      'numberOfDisplaySets',
      'Number of displays sets',
      numberOfDisplaySets
    );
    hangingProtocolService.addCustomAttribute(
      'numberOfDisplaySetsWithImages',
      'Number of displays sets with images',
      numberOfDisplaySetsWithImages
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

  /** Registers some additional hanging protocols.  See hp/index.tsx for more details */
  getHangingProtocolModule,
};

export default testExtension;
