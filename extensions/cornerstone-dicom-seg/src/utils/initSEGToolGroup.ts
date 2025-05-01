function createSEGToolGroupAndAddTools(ToolGroupService, customizationService, toolGroupId) {
  const tools = customizationService.getCustomization('cornerstone.overlayViewportTools');

  return ToolGroupService.createToolGroupAndAddTools(toolGroupId, tools);
}

export default createSEGToolGroupAndAddTools;
