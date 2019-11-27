import csTools from 'cornerstone-tools';

/**
 *
 * @param {object} configuration
 * @param {Object|Array} configuration.csToolsConfig
 */
export default function init({ servicesManager, configuration = {} }) {
  const {
    BrushTool,
    SphericalBrushTool,
    FreehandScissorsTool,
    RectangleScissorsTool,
    CircleScissorsTool,
    CorrectionScissorsTool,
  } = csTools;
  const tools = [
    BrushTool,
    SphericalBrushTool,
    FreehandScissorsTool,
    RectangleScissorsTool,
    CircleScissorsTool,
    CorrectionScissorsTool,
  ];

  tools.forEach(tool => csTools.addTool(tool));

  csTools.addTool(BrushTool, {
    name: 'BrushEraser',
    configuration: {
      alwaysEraseOnClick: true,
    },
  });
}
