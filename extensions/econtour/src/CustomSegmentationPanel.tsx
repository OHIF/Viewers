import React, { useEffect, useState, ReactNode } from 'react';
import { SegmentationTable } from '@ohif/ui-next';
import { useActiveViewportSegmentationRepresentations } from '@ohif/extension-cornerstone';
import { metaData } from '@cornerstonejs/core';
import { useSystem } from '@ohif/core/src';
import { useImageViewer } from '@ohif/ui-next';
import { useQuery } from '@tanstack/react-query';

// Define proper interface for component props
interface CustomSegmentationPanelProps {
  children?: ReactNode;
}

export default function CustomSegmentationPanel({ children }: CustomSegmentationPanelProps) {
  const { commandsManager, servicesManager } = useSystem();
  const { customizationService, displaySetService } = servicesManager.services;
  const internalImageViewer = useImageViewer();
  const StudyInstanceUIDs = internalImageViewer.StudyInstanceUIDs;

  // Define better typing for segmentationData
  const [segmentationDataToUse, setSegmentationDataToUse] = useState<Array<any>>([]);

  // Function to fetch contour info
  const fetchContourInfo = async (studyUID: string) => {
    if (!studyUID) {
      return null;
    }

    try {
      // Customize the environment as needed
      const environment = 'development';
      const baseUrl = environment ? `https://${environment}.econtour.org` : 'https://econtour.org';
      const url = `${baseUrl}/api/regions/?studyUID=${studyUID}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Error fetching contour data: ${response.status}`);
      }

      const data = await response.json();

      // Check if responseBody exists in the data
      if (!data.responseBody) {
        return data; // Return the whole data object if responseBody isn't present
      }

      return data.responseBody;
    } catch (error) {
      console.error('Error in fetchContourInfo:', error);
      throw error; // Re-throw to let React Query handle it
    }
  };

  // Use React Query to fetch and cache contour info
  const {
    data: contourInfo,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['contourInfo', StudyInstanceUIDs?.[0]],
    queryFn: () => (StudyInstanceUIDs?.[0] ? fetchContourInfo(StudyInstanceUIDs[0]) : null),
    enabled: !!StudyInstanceUIDs?.[0],
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1, // Only retry once
  });

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

  const CustomSegmentStatisticsHeader = customizationService.getCustomization(
    'panelSegmentation.customSegmentStatisticsHeader'
  ) as React.ComponentType | null;

  // Render custom components safely
  const renderCustomDropdownContent = () => {
    return CustomDropdownMenuContent ? <CustomDropdownMenuContent /> : null;
  };

  const renderCustomStatisticsHeader = () => {
    return CustomSegmentStatisticsHeader ? <CustomSegmentStatisticsHeader /> : null;
  };

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
    onToggleSegmentationRepresentationVisibility: (segmentationId, type) => {
      commandsManager.run('toggleSegmentationVisibility', { segmentationId, type });
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

  useEffect(() => {
    if (!contourInfo?.regions && !segmentationsWithRepresentations?.length) {
      return;
    }

    debugger;
    // Remove debugger statement
    setSegmentationDataToUse(segmentationsWithRepresentations);
  }, [segmentationsWithRepresentations, contourInfo]);

  if (!segmentationsWithRepresentations?.length) {
    return null;
  }

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
    contourInfo, // Pass the contour info from React Query
    isLoading,
    error: error ? (error as Error).message : null,
  };

  const renderSegments = () => {
    return (
      <SegmentationTable.Segments>
        <SegmentationTable.SegmentStatistics.Header>
          {renderCustomStatisticsHeader()}
        </SegmentationTable.SegmentStatistics.Header>
        <SegmentationTable.SegmentStatistics.Body />
      </SegmentationTable.Segments>
    );
  };

  // Render content based on mode
  const renderModeContent = () => {
    if (tableProps.mode === 'collapsed') {
      return (
        <SegmentationTable.Collapsed>
          <SegmentationTable.Collapsed.Header>
            <SegmentationTable.Collapsed.DropdownMenu>
              {renderCustomDropdownContent()}
            </SegmentationTable.Collapsed.DropdownMenu>
            <SegmentationTable.Collapsed.Selector />
            <SegmentationTable.Collapsed.Info />
          </SegmentationTable.Collapsed.Header>
          <SegmentationTable.Collapsed.Content>
            <SegmentationTable.AddSegmentRow />
            {renderSegments()}
          </SegmentationTable.Collapsed.Content>
        </SegmentationTable.Collapsed>
      );
    }

    return (
      <>
        <SegmentationTable.Expanded>
          <SegmentationTable.Expanded.Header>
            <SegmentationTable.Expanded.DropdownMenu>
              {renderCustomDropdownContent()}
            </SegmentationTable.Expanded.DropdownMenu>
            <SegmentationTable.Expanded.Label />
            <SegmentationTable.Expanded.Info />
          </SegmentationTable.Expanded.Header>

          <SegmentationTable.Expanded.Content>
            <SegmentationTable.AddSegmentRow />
            {renderSegments()}
          </SegmentationTable.Expanded.Content>
        </SegmentationTable.Expanded>
      </>
    );
  };

  return (
    <SegmentationTable {...tableProps}>
      {children}
      <SegmentationTable.Config />
      <SegmentationTable.AddSegmentationRow />
      {renderModeContent()}
    </SegmentationTable>
  );
}
