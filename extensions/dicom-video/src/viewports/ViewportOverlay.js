import { ViewportOverlay } from "@ohif/ui";
import ConfigPoint from 'config-point';

const { VideoViewportOverlay } = ConfigPoint.register({
  VideoViewportOverlay: {
    configBase: 'ViewportOverlay',
    topLeft: [
      null,
      { id: 'Video specific content' },
    ]
  }
});

export default VideoViewportOverlay.generateFromConfig(VideoViewportOverlay);
