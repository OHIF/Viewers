import ConfigPoint from 'config-point'
import { ViewportOverlay } from '@ohif/ui'

const { videoViewportOverlayConfig } = ConfigPoint.register({
  videoViewportOverlayConfig: {
    configBase: 'viewportOverlayConfig',
  }
});

/**
 * Default to using the videoViewportOverlayConfig.
 * @param {*} props
 * @returns Viewport overlay for video
 */
const VideoViewportOverlay = props => ViewportOverlay({
  viewportOverlayConfig: videoViewportOverlayConfig,
  ...props,
});

export default VideoViewportOverlay;
