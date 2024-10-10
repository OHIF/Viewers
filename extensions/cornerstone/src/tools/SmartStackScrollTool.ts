import { getEnabledElementByIds } from '@cornerstonejs/core';
import { StackScrollTool, Types } from '@cornerstonejs/tools';

class SmartStackScrollTool extends StackScrollTool {
  parentDragCallback: (evt: Types.EventTypes.InteractionEventType) => void;

  constructor(toolProps, defaultToolProps) {
    super(toolProps, defaultToolProps);
    this.parentDragCallback = this._dragCallback;
    this._dragCallback = this._smartDragCallback;
  }

  _smartDragCallback(evt: Types.EventTypes.InteractionEventType) {
    const { deltaPoints, viewportId, renderingEngineId } = evt.detail;
    const { viewport } = getEnabledElementByIds(viewportId, renderingEngineId);
    const { invert, shouldPreventScroll } = this.configuration;
    const deltaPointY = deltaPoints.canvas[1];
    const pixelsPerImage = this._getPixelPerImage(viewport);
    const deltaY = deltaPointY + this.deltaY;
    const imageIdIndexOffset = Math.round(deltaY / pixelsPerImage);
    const delta = invert ? -imageIdIndexOffset : imageIdIndexOffset;

    if (shouldPreventScroll(evt.detail.event.ctrlKey, viewport.getCurrentImageIdIndex() + delta)) {
      return;
    }

    return this.parentDragCallback(evt);
  }
}

SmartStackScrollTool.toolName = 'SmartStackScroll';
export default SmartStackScrollTool;
