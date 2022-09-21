import {
  Types,
  metaData,
  utilities as csUtils,
  cache,
} from '@cornerstonejs/core';
import {
  AnnotationTool,
  annotation,
  drawing,
  segmentation as cstSegmentation,
  utilities,
  Types as cs3DToolsTypes,
} from '@cornerstonejs/tools';

export default class SegmentationCrosshairs extends AnnotationTool {
  static toolName = 'SegmentationCrosshairs';

  constructor(
    toolProps = {},
    defaultToolProps = {
      configuration: {
        segmentIndex: null,
        segments: [],
        segmentationId: null,
      },
    }
  ) {
    super(toolProps, defaultToolProps);
  }

  isPointNearTool = () => null;
  getHandleNearImagePoint = () => null;

  renderAnnotation = (
    enabledElement: Types.IEnabledElement,
    svgDrawingHelper: any
  ): void => {
    const { segmentIndex, segments, segmentationId } = this.configuration;

    if (!segmentIndex || !segments || !segmentationId) {
      return;
    }

    const segmentation = cstSegmentation.state.getSegmentation(segmentationId);

    if (!segmentation) {
      return;
    }

    const { cachedStats } = segmentation;

    if (!cachedStats) {
      return;
    }

    const { segmentCenter } = cachedStats;

    if (!segmentCenter) {
      return;
    }

    const { center, modifyTime } = segmentCenter[segmentIndex];

    if (!center || !modifyTime) {
      return;
    }

    const { x, y, z } = center;
  };
}
