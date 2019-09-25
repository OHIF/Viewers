import OHIF from '@ohif/core';
import cornerstone from 'cornerstone-core';

/**
 * I have no idea why this exists. It previously lived in the OHIFCornerstoneViewport
 *
 * @export
 * @param {*} configuration
 */
export default function init(configuration) {
  const { StackManager } = OHIF.utils;
  const metadataProvider = new OHIF.cornerstone.MetadataProvider();

  cornerstone.metaData.addProvider(
    metadataProvider.provider.bind(metadataProvider)
  );

  StackManager.setMetadataProvider(metadataProvider);
}
