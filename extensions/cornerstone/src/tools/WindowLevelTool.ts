import { Enums, getEnabledElement } from '@cornerstonejs/core';
import { WindowLevelTool as CornerstoneWindowLevelTool } from '@cornerstonejs/tools';

/**
 * Viewport types that have no VOI range, so window/level cannot apply to them.
 */
const UNSUPPORTED_VIEWPORT_TYPES: string[] = [Enums.ViewportType.ECG, Enums.ViewportType.ECG_NEXT];

/**
 * Window/Level tool that ignores drags on viewports without a VOI range (e.g. ECG)
 * instead of throwing "Viewport is not a valid type". It keeps the same tool name,
 * so it is a drop-in replacement for the Cornerstone tool.
 */
class WindowLevelTool extends CornerstoneWindowLevelTool {
  mouseDragCallback(evt) {
    const { viewport } = getEnabledElement(evt.detail.element) ?? {};

    if (!viewport || UNSUPPORTED_VIEWPORT_TYPES.includes(viewport.type)) {
      return;
    }

    return super.mouseDragCallback(evt);
  }
}

export default WindowLevelTool;
