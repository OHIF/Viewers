function createSEGToolGroupAndAddTools(ToolGroupService, customizationService, toolGroupId) {
  const { tools } = customizationService.get('cornerstone.overlayViewportTools') ?? {};

  return ToolGroupService.createToolGroupAndAddTools(toolGroupId, tools);
}

export default createSEGToolGroupAndAddTools;
