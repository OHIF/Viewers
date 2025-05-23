import { UltrasoundPleuraBLineTool } from '@cornerstonejs/tools';

// Global state to control whether to show the percentage in the overlay
let showPercentage = true;

/**
 * Sets whether to show the pleura percentage in the viewport overlay
 * @param value - Boolean indicating whether to show the percentage
 */
export function setShowPercentage(value) {
  showPercentage = value;
}

/**
 * Creates and returns the customization module for ultrasound annotation
 * @param params - Object containing commandsManager and servicesManager
 * @returns Array of customization objects for the viewport overlay
 */
function getCustomizationModule({ commandsManager, servicesManager }) {
  return [
    {
      name: 'default',
      value: {
        'viewportOverlay.topLeft': [
          {
            id: 'BLinePleuraPercentage',
            inheritsFrom: 'ohif.overlayItem',
            label: '',
            title: 'BLinePleuraPercentage',
            condition: ({ referenceInstance }) => referenceInstance?.Modality.includes('US'),
            contentF: () => {
              if (!showPercentage) {
                return;
              }
              const { viewportGridService, toolGroupService, cornerstoneViewportService } =
                servicesManager.services;
              const activeViewportId = viewportGridService.getActiveViewportId();
              const toolGroup = toolGroupService.getToolGroupForViewport(activeViewportId);
              if (!toolGroup) {
                return 'B-Line/Pleura : N/A';
              }
              const usAnnotation = toolGroup.getToolInstance(UltrasoundPleuraBLineTool.toolName);
              if (usAnnotation) {
                const viewport =
                  cornerstoneViewportService.getCornerstoneViewport(activeViewportId);
                return `B-Line/Pleura : ${usAnnotation.calculateBLinePleuraPercentage(viewport).toFixed(2)} %`;
              }
              return 'B-Line/Pleura : N/A';
            },
          },
        ],
      },
    },
  ];
}

export default getCustomizationModule;
