import Hammer from 'hammerjs';
import cornerstone from 'cornerstone-core';
import cornerstoneMath from 'cornerstone-math';
import cornerstoneTools from 'cornerstone-tools';
import OHIF from '@ohif/core';

const { log } = OHIF;

export default function(configuration = {}) {
  // For debugging
  window.cornerstoneTools = cornerstoneTools;

  cornerstoneTools.external.cornerstone = cornerstone;
  cornerstoneTools.external.Hammer = Hammer;
  cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
  cornerstoneTools.init(configuration);

  cornerstoneTools.loadHandlerManager.setErrorLoadingHandler(
    (element, imageId, error) => {
      log.error(imageId);
      throw error;
    }
  );

  // Set the tool font and font size
  // context.font = "[style] [variant] [weight] [size]/[line height] [font family]";
  const fontFamily =
    'Roboto, OpenSans, HelveticaNeue-Light, Helvetica Neue Light, Helvetica Neue, Helvetica, Arial, Lucida Grande, sans-serif';
  cornerstoneTools.textStyle.setFont(`16px ${fontFamily}`);

  // Tool styles/colors
  cornerstoneTools.toolStyle.setToolWidth(2);
  cornerstoneTools.toolColors.setToolColor('rgb(255, 255, 0)');
  cornerstoneTools.toolColors.setActiveColor('rgb(0, 255, 0)');

  cornerstoneTools.store.state.touchProximity = 40;

  // Configure stack prefetch
  cornerstoneTools.stackPrefetch.setConfiguration({
    maxImagesToPrefetch: configuration.maxImagesToPrefetch,
    preserveExistingPool: configuration.preserveExistingPool,
    maxSimultaneousRequests: configuration.maxSimultaneousRequests,
  });
}
