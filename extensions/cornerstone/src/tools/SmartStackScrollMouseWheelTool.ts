import { getEnabledElement } from '@cornerstonejs/core';
import { StackScrollMouseWheelTool, Types } from '@cornerstonejs/tools';

class SmartStackScrollMouseWheelTool extends StackScrollMouseWheelTool {
  parentMouseWheelCallback: (evt: Types.EventTypes.MouseWheelEventType) => void;

  constructor(toolProps, defaultToolProps) {
    super(toolProps, defaultToolProps);
    this.parentMouseWheelCallback = this.mouseWheelCallback;
    this.mouseWheelCallback = this.smartMouseWheelCallback;
  }

  smartMouseWheelCallback(evt: Types.EventTypes.MouseWheelEventType): void {
    const { wheel, element } = evt.detail;
    const { direction } = wheel;
    const { invert, shouldPreventScroll } = this.configuration;
    const { viewport } = getEnabledElement(element);
    const delta = direction * (invert ? -1 : 1);

    if (shouldPreventScroll(evt.detail.event.ctrlKey, viewport.getCurrentImageIdIndex() + delta)) {
      return;
    }

    this.parentMouseWheelCallback(evt);
  }
}

SmartStackScrollMouseWheelTool.toolName = 'SmartStackScrollMouseWheel';
export default SmartStackScrollMouseWheelTool;
