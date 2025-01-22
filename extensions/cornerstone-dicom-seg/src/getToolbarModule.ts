export function getToolbarModule({ servicesManager }: withAppTypes) {
  const { segmentationService, toolbarService, toolGroupService } = servicesManager.services;

  return [
    {
      name: 'evaluate.cornerstone.segmentation',
      evaluate: ({ viewportId, button, toolNames, disabledText }) => {
        const segmentations = segmentationService.getSegmentationRepresentations(viewportId);

        if (!segmentations?.length) {
          return {
            disabled: true,
            disabledText: disabledText ?? 'No segmentations available',
          };
        }

        const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);
        if (!toolGroup) {
          return {
            disabled: true,
            disabledText: disabledText ?? 'Not available on the current viewport',
          };
        }

        const toolName = toolbarService.getToolNameForButton(button);

        if (!toolGroup.hasTool(toolName) && !toolNames) {
          return {
            disabled: true,
            disabledText: disabledText ?? 'Not available on the current viewport',
          };
        }

        const activeMouseButtonTool = toolGroup.getActivePrimaryMouseButtonTool();
        const isPrimaryActive = toolNames
          ? toolNames.includes(activeMouseButtonTool)
          : activeMouseButtonTool === toolName;

        // Button components now handle final styling.
        return {
          disabled: false,
          isActive: isPrimaryActive,
        };
      },
    },
  ];
}
