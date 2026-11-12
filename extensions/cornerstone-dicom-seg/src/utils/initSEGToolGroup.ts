function createSEGToolGroupAndAddTools({
  commandsManager,
  toolGroupService,
  customizationService,
  toolGroupId,
}) {
  const tools = customizationService.getCustomization('cornerstone.overlayViewportTools');

  const updatedTools = commandsManager.run('initializeSegmentLabelTool', { tools });

  return toolGroupService.createToolGroupAndAddTools(toolGroupId, updatedTools);
}

export default createSEGToolGroupAndAddTools;
