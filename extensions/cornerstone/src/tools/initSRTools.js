import cornerstoneTools from 'cornerstone-tools';
import DICOMSRDisplayTool from './DICOMSRDisplayTool';
import TOOL_NAMES from './constants/toolNames';
import getToolAlias from './utils/getToolAlias';

/**
 * Initialize SR cornerstone tools.
 *
 * @param {*} targetElement
 */
const initSRTools = targetElement => {
  const primaryToolId = 'Wwwc';
  const toolAlias = getToolAlias(primaryToolId); // These are 1:1 for built-in only

  // ~~ MAGIC
  cornerstoneTools.addToolForElement(targetElement, DICOMSRDisplayTool);
  cornerstoneTools.setToolEnabledForElement(
    targetElement,
    TOOL_NAMES.DICOM_SR_DISPLAY_TOOL
  );

  // ~~ Variants
  cornerstoneTools.addToolForElement(
    targetElement,
    cornerstoneTools.LengthTool,
    {
      name: 'SRLength',
      configuration: {
        renderDashed: true,
      },
    }
  );
  cornerstoneTools.addToolForElement(
    targetElement,
    cornerstoneTools.ArrowAnnotateTool,
    {
      name: 'SRArrowAnnotate',
      configuration: {
        renderDashed: true,
      },
    }
  );
  cornerstoneTools.addToolForElement(
    targetElement,
    cornerstoneTools.BidirectionalTool,
    {
      name: 'SRBidirectional',
      configuration: {
        renderDashed: true,
      },
    }
  );
  cornerstoneTools.addToolForElement(
    targetElement,
    cornerstoneTools.EllipticalRoiTool,
    {
      name: 'SREllipticalRoi',
      configuration: {
        renderDashed: true,
      },
    }
  );
  cornerstoneTools.addToolForElement(
    targetElement,
    cornerstoneTools.RectangleRoiTool,
    {
      name: 'SRRectangleRoi',
      configuration: {
        renderDashed: true,
      },
    }
  );
  cornerstoneTools.addToolForElement(
    targetElement,
    cornerstoneTools.FreehandRoiTool,
    {
      name: 'SRFreehandRoi',
      configuration: {
        renderDashed: true,
      },
    }
  );

  // ~~ Business as usual
  cornerstoneTools.setToolActiveForElement(targetElement, 'PanMultiTouch', {
    pointers: 2,
  });
  cornerstoneTools.setToolActiveForElement(targetElement, 'ZoomTouchPinch', {});

  // TODO: Add always dashed tool alternative aliases
  // TODO: or same name... alternative config?
  cornerstoneTools.setToolActiveForElement(targetElement, toolAlias, {
    mouseButtonMask: 1,
  });
  cornerstoneTools.setToolActiveForElement(targetElement, 'Pan', {
    mouseButtonMask: 4,
  });
  cornerstoneTools.setToolActiveForElement(targetElement, 'Zoom', {
    mouseButtonMask: 2,
  });
  cornerstoneTools.setToolActiveForElement(
    targetElement,
    'StackScrollMouseWheel',
    {}
  );
};

export default initSRTools;
