import cornerstoneTools from 'cornerstone-tools';
import growCutFromCircle from './strategies/growCutFromCircle';

const BaseTool = cornerstoneTools.importInternal('base/BaseTool');

/**
 * @public
 * @class SphericalGrowCutSegmentationTool
 * @memberof Tools
 * @classdesc Tool for segmenting a region by drawing a sphere.
 * @extends Tools.Base.BaseTool
 */
export default class SphericalGrowCutSegmentationTool extends BaseTool {
  /** @inheritdoc */
  constructor(props = {}) {
    const defaultProps = {
      name: 'SphericalGrowCutSegmentation',
      configuration: {
        shouldCleanSegment: false,
      },
      strategies: {
        GROW_CUT: growCutFromCircle,
      },
      defaultStrategy: 'GROW_CUT',
      supportedInteractionTypes: ['Mouse'],
      mixins: ['circleSegmentationMixin'],
    };

    super(props, defaultProps);
  }
}
