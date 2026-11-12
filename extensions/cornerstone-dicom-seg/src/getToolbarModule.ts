import { utilities as cstUtils } from '@cornerstonejs/tools';
import i18n from '@ohif/i18n';
import { useUIStateStore } from '@ohif/extension-default';

import LogicalContourOperationsOptions from './components/LogicalContourOperationsOptions';
import SimplifyContourOptions from './components/SimplifyContourOptions';
import SmoothContoursOptions from './components/SmoothContoursOptions';

export function getToolbarModule({ servicesManager }: withAppTypes) {
  const { segmentationService, toolbarService, toolGroupService } = servicesManager.services;
  return [
    {
      name: 'cornerstone.SimplifyContourOptions',
      defaultComponent: SimplifyContourOptions,
    },
    {
      name: 'cornerstone.LogicalContourOperationsOptions',
      defaultComponent: LogicalContourOperationsOptions,
    },
    {
      name: 'cornerstone.SmoothContoursOptions',
      defaultComponent: SmoothContoursOptions,
    },
    {
      name: 'cornerstone.isActiveSegmentationUtility',
      evaluate: ({ button }) => {
        const { uiState } = useUIStateStore.getState();
        return {
          isActive: uiState[`activeSegmentationUtility`] === button.id,
        };
      },
    },
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
            disabledText: i18n.t('SegmentationPanel:No segmentations available'),
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
            disabledText: disabledText ?? i18n.t('SegmentationPanel:No segmentations available'),
          };
        }

        const activeSegmentation = segmentationService.getActiveSegmentation(viewportId);
        if (!Object.keys(activeSegmentation.segments).length) {
          return {
            disabled: true,
            disabledText: i18n.t('SegmentationPanel:Add segment to enable this tool'),
          };
        }

        const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);

        if (!toolGroup) {
          return {
            disabled: true,
            disabledText: disabledText ?? i18n.t('SegmentationPanel:Not available on the current viewport'),
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
            disabledText: disabledText ?? i18n.t('SegmentationPanel:Not available on the current viewport'),
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
    {
      name: 'evaluate.cornerstone.segmentation.synchronizeDrawingRadius',
      evaluate: ({ button, radiusOptionId }) => {
        const toolGroupIds = toolGroupService.getToolGroupIds();
        if (!toolGroupIds?.length) {
          return;
        }

        for (const toolGroupId of toolGroupIds) {
          const brushSize = cstUtils.segmentation.getBrushSizeForToolGroup(toolGroupId);

          if (brushSize) {
            const option = toolbarService.getOptionById(button, radiusOptionId);
            option.value = brushSize;
          }
        }
      },
    },
  ];
}
