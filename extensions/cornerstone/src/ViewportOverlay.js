import ConfigPoint from 'config-point'
import { ViewportOverlay } from '@ohif/ui'

const { cornerstoneViewportOverlayConfig } = ConfigPoint.register({
  cornerstoneViewportOverlayConfig: {
    configBase: 'viewportOverlayConfig',
  }
});

/**
 * Default to using the cornerstoneViewportOverlayConfig.
 * @param {*} props
 * @returns Viewport overlay for cornerstone
 */
const CornerstoneViewportOverlay = props => ViewportOverlay({
  viewportOverlayConfig: cornerstoneViewportOverlayConfig,
  ...props,
});

export default CornerstoneViewportOverlay;
