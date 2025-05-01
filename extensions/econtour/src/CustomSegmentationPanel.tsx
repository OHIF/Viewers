import React, { ReactNode, useCallback } from 'react';
import { useActiveViewportSegmentationRepresentations } from '@ohif/extension-cornerstone';
import { metaData } from '@cornerstonejs/core';
import { useSystem } from '@ohif/core/src';
import CustomSegmentationTable from './CustomSegmentationTable';
import { useViewportGrid } from '@ohif/ui-next';

// Define proper interface for component props
interface CustomSegmentationPanelProps {
  children?: ReactNode;
}

export default function CustomSegmentationPanel({ children }: CustomSegmentationPanelProps) {
  const { commandsManager, servicesManager } = useSystem();
  const { customizationService, displaySetService, segmentationService } = servicesManager.services;
  const [viewportGridState] = useViewportGrid();
  const viewportId = viewportGridState.activeViewportId;

  const { segmentationsWithRepresentations, disabled } =
    useActiveViewportSegmentationRepresentations({
      servicesManager,
    });

  // Extract customization options
  const segmentationTableMode = customizationService.getCustomization(
    'panelSegmentation.tableMode'
  ) as unknown as string;
  const onSegmentationAdd = customizationService.getCustomization(
    'panelSegmentation.onSegmentationAdd'
  );
  const disableEditing = customizationService.getCustomization('panelSegmentation.disableEditing');
  const showAddSegment = customizationService.getCustomization('panelSegmentation.showAddSegment');

  // Get custom components with proper typing
  const CustomDropdownMenuContent = customizationService.getCustomization(
    'panelSegmentation.customDropdownMenuContent'
  ) as React.ComponentType | null;

  // Render custom components safely
  const renderCustomDropdownContent = () => {
    return CustomDropdownMenuContent ? <CustomDropdownMenuContent /> : null;
  };

  // Custom handler for toggling visibility of segments in the active group
  const toggleGroupVisibility = useCallback(
    (segmentationId, type, activeGroup) => {
      // If no active group, use the default behavior to toggle all segments
      if (!activeGroup) {
        commandsManager.run('toggleSegmentationVisibility', { segmentationId, type });
        return;
      }

      // Find the segmentation data
      const segmentationInfo = segmentationsWithRepresentations.find(
        entry => entry.segmentation.segmentationId === segmentationId
      );

      if (!segmentationInfo) {
        return;
      }

      const { segmentation } = segmentationInfo;
      const segments = Object.values(segmentation.segments);

      // Get all segments from the active group
      const groupSegments = segments.filter(segment => segment && segment.group === activeGroup);

      // Skip if no segments in this group
      if (groupSegments.length === 0) {
        return;
      }

      // Check if all segments in this group are visible
      groupSegments.forEach(segment => {
        const segmentIndex = segment.segmentIndex;
        debugger;
        segmentationService.toggleSegmentVisibility(viewportId, segmentationId, segmentIndex, type);
      });
    },
    [commandsManager, segmentationsWithRepresentations, viewportId, segmentationService]
  );

  // Create handlers object for all command runs
  const handlers = {
    onSegmentationClick: (segmentationId: string) => {
      commandsManager.run('setActiveSegmentation', { segmentationId });
    },
    onSegmentAdd: segmentationId => {
      commandsManager.run('addSegment', { segmentationId });
    },
    onSegmentClick: (segmentationId, segmentIndex) => {
      commandsManager.run('setActiveSegmentAndCenter', { segmentationId, segmentIndex });
    },
    onSegmentEdit: (segmentationId, segmentIndex) => {
      commandsManager.run('editSegmentLabel', { segmentationId, segmentIndex });
    },
    onSegmentationEdit: segmentationId => {
      commandsManager.run('editSegmentationLabel', { segmentationId });
    },
    onSegmentColorClick: (segmentationId, segmentIndex) => {
      commandsManager.run('editSegmentColor', { segmentationId, segmentIndex });
    },
    onSegmentDelete: (segmentationId, segmentIndex) => {
      commandsManager.run('deleteSegment', { segmentationId, segmentIndex });
    },
    onToggleSegmentVisibility: (segmentationId, segmentIndex, type) => {
      commandsManager.run('toggleSegmentVisibility', { segmentationId, segmentIndex, type });
    },
    onToggleSegmentLock: (segmentationId, segmentIndex) => {
      commandsManager.run('toggleSegmentLock', { segmentationId, segmentIndex });
    },
    onToggleSegmentationRepresentationVisibility: (segmentationId, type, activeGroup) => {
      toggleGroupVisibility(segmentationId, type, activeGroup);
    },
    onSegmentationDownload: segmentationId => {
      commandsManager.run('downloadSegmentation', { segmentationId });
    },
    setStyle: (segmentationId, type, key, value) => {
      commandsManager.run('setSegmentationStyle', { segmentationId, type, key, value });
    },
    toggleRenderInactiveSegmentations: () => {
      commandsManager.run('toggleRenderInactiveSegmentations');
    },
    onSegmentationRemoveFromViewport: segmentationId => {
      commandsManager.run('removeSegmentationFromViewport', { segmentationId });
    },
    onSegmentationDelete: segmentationId => {
      commandsManager.run('deleteSegmentation', { segmentationId });
    },
    setFillAlpha: ({ type }, value) => {
      commandsManager.run('setFillAlpha', { type, value });
    },
    setOutlineWidth: ({ type }, value) => {
      commandsManager.run('setOutlineWidth', { type, value });
    },
    setRenderFill: ({ type }, value) => {
      commandsManager.run('setRenderFill', { type, value });
    },
    setRenderOutline: ({ type }, value) => {
      commandsManager.run('setRenderOutline', { type, value });
    },
    setFillAlphaInactive: ({ type }, value) => {
      commandsManager.run('setFillAlphaInactive', { type, value });
    },
    getRenderInactiveSegmentations: () => {
      return commandsManager.run('getRenderInactiveSegmentations');
    },
  };

  // Generate export options
  const exportOptions = segmentationsWithRepresentations.map(({ segmentation }) => {
    const { representationData, segmentationId } = segmentation;
    const { Labelmap } = representationData;

    if (!Labelmap) {
      return { segmentationId, isExportable: true };
    }

    // Define a proper interface for the Labelmap type
    interface LabelmapWithImageIds {
      referencedImageIds?: string[];
    }

    // Use proper type casting
    const labelmapWithRefs = Labelmap as LabelmapWithImageIds;
    const referencedImageIds = labelmapWithRefs.referencedImageIds || [];
    const firstImageId = referencedImageIds[0];
    const instance = metaData.get('instance', firstImageId);

    if (!instance) {
      return { segmentationId, isExportable: false };
    }

    const SOPInstanceUID = instance.SOPInstanceUID || instance.SopInstanceUID;
    const SeriesInstanceUID = instance.SeriesInstanceUID;
    const displaySet = displaySetService.getDisplaySetForSOPInstanceUID(
      SOPInstanceUID,
      SeriesInstanceUID
    );

    return {
      segmentationId,
      isExportable: displaySet?.isReconstructable,
    };
  });

  // Common props for SegmentationTable
  const tableProps = {
    disabled,
    data: segmentationsWithRepresentations,
    mode: segmentationTableMode,
    title: 'Segmentations',
    exportOptions,
    disableEditing,
    onSegmentationAdd,
    showAddSegment,
    showSegmentIndex: false, // Hide segment index numbers
    renderInactiveSegmentations: handlers.getRenderInactiveSegmentations(),
    ...handlers,
  };

  // Rendering of segments is now handled by our CustomSegmentationTable component

  return (
    <CustomSegmentationTable
      {...tableProps}
      renderCustomDropdownContent={renderCustomDropdownContent}
    >
      {children}
    </CustomSegmentationTable>
  );
}
