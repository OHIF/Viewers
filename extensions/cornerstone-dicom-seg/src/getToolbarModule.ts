export function getToolbarModule({ servicesManager }: withAppTypes) {
  const { segmentationService, toolbarService, toolGroupService, customizationService } =
    servicesManager.services;
  return [
    {
      name: 'evaluate.cornerstone.hasSegmentation',
      evaluate: ({ viewportId }) => {
        const segmentations = segmentationService.getSegmentationRepresentations(viewportId);
        return {
          disabled: !segmentations?.length,
        };
      },
    },
    {
      name: 'evaluate.cornerstone.hasSegmentationOfType',
      evaluate: ({ viewportId, segmentationRepresentationType }) => {
        const segmentations = segmentationService.getSegmentationRepresentations(viewportId);

        if (!segmentations?.length) {
          return {
            disabled: true,
            disabledText: 'No segmentations available',
          };
        }

        if (
          !segmentations.some(segmentation =>
            Boolean(segmentation.type === segmentationRepresentationType)
          )
        ) {
          return {
            disabled: true,
            disabledText: `No ${segmentationRepresentationType} segmentations available`,
            visible: customizationService.getCustomization('panelSegmentation.isMultiTab'),
          };
        }
      },
    },
    {
      name: 'evaluate.cornerstone.isActiveSegmentationOfType',
      evaluate: ({ viewportId, segmentationRepresentationType }) => {
        const activeSegmentation = segmentationService.getActiveSegmentation(viewportId);
        if (!activeSegmentation || !Object.keys(activeSegmentation.segments).length) {
          return {
            disabled: true,
            disabledText: 'Add segment to enable this tool',
          };
        }

        const activeRepresentations = segmentationService.getSegmentationRepresentations(
          viewportId,
          {
            segmentationId: activeSegmentation.segmentationId,
            type: segmentationRepresentationType,
          }
        );
        if (!activeRepresentations?.length) {
          return {
            disabled: true,
            disabledText: `Active segmentation is not a ${segmentationRepresentationType} segmentation`,
            // Set the visible flag to false for single tab mode so that only the tools and utilities for
            // the active segmentation representation type are shown. This is not needed for multi-tab mode because
            // the tools and utilities are already segregated by by type in each tab.
            visible: customizationService.getCustomization('panelSegmentation.isMultiTab'),
          };
        }
      },
    },
    {
      name: 'evaluate.cornerstone.segmentation',
      evaluate: ({ viewportId, button, toolNames, disabledText }) => {
        // Todo: we need to pass in the button section Id since we are kind of
        // forcing the button to have black background since initially
        // it is designed for the toolbox not the toolbar on top
        // we should then branch the buttonSectionId to have different styles
        const segmentations = segmentationService.getSegmentationRepresentations(viewportId);
        if (!segmentations?.length) {
          return {
            disabled: true,
            disabledText: disabledText ?? 'No segmentations available',
          };
        }

        const activeSegmentation = segmentationService.getActiveSegmentation(viewportId);
        if (!Object.keys(activeSegmentation.segments).length) {
          return {
            disabled: true,
            disabledText: 'Add segment to enable this tool',
          };
        }

        const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);

        if (!toolGroup) {
          return {
            disabled: true,
            disabledText: disabledText ?? 'Not available on the current viewport',
          };
        }

        if (!toolNames) {
          return {
            disabled: false,
            // isActive: false,
          };
        }

        const toolName = toolbarService.getToolNameForButton(button);

        if (!toolGroup.hasTool(toolName) && !toolNames) {
          return {
            disabled: true,
            disabledText: disabledText ?? 'Not available on the current viewport',
          };
        }

        const isPrimaryActive = toolNames
          ? toolNames.includes(toolGroup.getActivePrimaryMouseButtonTool())
          : toolGroup.getActivePrimaryMouseButtonTool() === toolName;

        return {
          disabled: false,
          isActive: isPrimaryActive,
        };
      },
    },
  ];
}
