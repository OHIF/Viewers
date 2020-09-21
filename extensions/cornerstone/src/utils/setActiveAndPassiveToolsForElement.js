import csTools from 'cornerstone-tools';

export default function _setActiveAndPassiveToolsForElement(element, tools) {
  const BaseAnnotationTool = csTools.importInternal('base/BaseAnnotationTool');

  tools.forEach(tool => {
    if (tool.prototype instanceof BaseAnnotationTool) {
      // BaseAnnotationTool would likely come from csTools lib exports
      const toolName = new tool().name;
      csTools.setToolPassiveForElement(element, toolName); // there may be a better place to determine name; may not be on uninstantiated class
    }
  });

  csTools.setToolActiveForElement(element, 'Pan', { mouseButtonMask: 4 });
  csTools.setToolActiveForElement(element, 'Zoom', { mouseButtonMask: 2 });
  csTools.setToolActiveForElement(element, 'Wwwc', { mouseButtonMask: 1 });
  csTools.setToolActiveForElement(element, 'StackScrollMouseWheel', {}); // TODO: Empty options should not be required
  csTools.setToolActiveForElement(element, 'PanMultiTouch', { pointers: 2 }); // TODO: Better error if no options
  csTools.setToolActiveForElement(element, 'ZoomTouchPinch', {});
  csTools.setToolEnabledForElement(element, 'Overlay', {});
}
