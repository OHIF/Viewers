import { addTool, annotation } from '@cornerstonejs/tools';
import DICOMSRDisplayTool from './tools/DICOMSRDisplayTool';

/**
 * @param {object} configuration
 */
export default function init({ configuration = {} }) {
  addTool(DICOMSRDisplayTool);

  // Modify annotation tools to use dashed lines on SR
  const dashedLine = {
    lineDash: '4,4',
  };
  annotation.config.style.setToolGroupToolStyles('SRToolGroup', {
    Length: dashedLine,
    ArrowAnnotate: dashedLine,
    Bidirectional: dashedLine,
    EllipticalROI: dashedLine,
    RectangleROI: dashedLine,
    global: {},
  });
}
