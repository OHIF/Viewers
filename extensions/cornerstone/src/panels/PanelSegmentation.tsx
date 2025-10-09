import React, { useCallback, useEffect, useRef } from 'react';
import {
  IconPresentationProvider,
  Popover,
  PopoverAnchor,
  PopoverContent,
  SegmentationTable,
  ToolSettings,
} from '@ohif/ui-next';
import { useActiveViewportSegmentationRepresentations } from '../hooks/useActiveViewportSegmentationRepresentations';
import { metaData, cache } from '@cornerstonejs/core';
import { useActiveToolOptions, useSystem } from '@ohif/core/src';
import { SegmentationRepresentations } from '@cornerstonejs/tools/enums';
import { Toolbar, useUIStateStore } from '@ohif/extension-default';
import SegmentationUtilityButton from '../components/SegmentationUtilityButton';
import { useSelectedSegmentationsForViewportStore } from '../stores';

type PanelSegmentationProps = {
  children?: React.ReactNode;

  // The representation type for this segmentation panel. Undefined means all types.
  segmentationRepresentationType?: SegmentationRepresentations;
} & withAppTypes;

export default function PanelSegmentation({
  children,
  segmentationRepresentationType,
}: PanelSegmentationProps) {
  const { commandsManager, servicesManager } = useSystem();
  const { customizationService, displaySetService, viewportGridService, toolbarService } =
    servicesManager.services;
  const { activeViewportId } = viewportGridService.getState();

  const utilitiesSectionMap = {
    [SegmentationRepresentations.Labelmap]: toolbarService.sections.labelMapSegmentationUtilities,
    [SegmentationRepresentations.Contour]: toolbarService.sections.contourSegmentationUtilities,
  };

  const selectedSegmentationsForViewportMap = useSelectedSegmentationsForViewportStore(
    store => store.selectedSegmentationsForViewport[activeViewportId]
  );

  const selectedSegmentationIdForType = segmentationRepresentationType
    ? selectedSegmentationsForViewportMap?.get(segmentationRepresentationType)
    : undefined;

  const buttonSection = utilitiesSectionMap[segmentationRepresentationType];

  const { activeToolOptions: activeUtilityOptions } = useActiveToolOptions({
    buttonSectionId: buttonSection,
  });

  const { segmentationsWithRepresentations, disabled } =
    useActiveViewportSegmentationRepresentations();

  const setUIState = useUIStateStore(store => store.setUIState);

  // useEffect for handling clicks on any of the non-active viewports.
  // The ViewportGrid stops the propagation of pointer/mouse events
  // for non-active viewports so the Popover below
  // is not closed when clicking on any of the non-active viewports.
  useEffect(() => {
    setUIState('activeSegmentationUtility', null);
    toolbarService.refreshToolbarState({ viewportId: activeViewportId });
  }, [activeViewportId, setUIState, toolbarService]);

  // The callback for handling clicks outside of the Popover and, the SegmentationUtilityButton
  // that triggered it to open. Clicks outside those components must close the Popover.
  // The Popover is made visible whenever the options associated with the
  // activeSegmentationUtility exist. Thus clearing the activeSegmentationUtility
  // clears the associated options and will keep the Popover closed.
  const handlePopoverOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setUIState('activeSegmentationUtility', null);
        toolbarService.refreshToolbarState({ viewportId: activeViewportId });
      }
    },
    [activeViewportId, setUIState, toolbarService]
  );

  // Extract customization options
  const segmentationTableMode = customizationService.getCustomization(
    'panelSegmentation.tableMode'
  ) as unknown as string;
  const onSegmentationAdd = customizationService.getCustomization(
    'panelSegmentation.onSegmentationAdd'
  );
  const disableEditing = customizationService.getCustomization('panelSegmentation.disableEditing');
  const showAddSegment = customizationService.getCustomization('panelSegmentation.showAddSegment');
  const CustomDropdownMenuContent = customizationService.getCustomization(
    'panelSegmentation.customDropdownMenuContent'
  );

  const CustomSegmentStatisticsHeader = customizationService.getCustomization(
    'panelSegmentation.customSegmentStatisticsHeader'
  );

  // Create handlers object for all command runs
  const handlers = {
    onSegmentationClick: (segmentationId: string) => {
      commandsManager.run('setActiveSegmentation', { segmentationId });
    },
    onSegmentAdd: segmentationId => {
      commandsManager.run('addSegment', { segmentationId });
      commandsManager.run('setActiveSegmentation', { segmentationId });
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
    onSegmentCopy:
      segmentationRepresentationType === SegmentationRepresentations.Contour
        ? (segmentationId, segmentIndex) => {
            commandsManager.run('copyContourSegment', {
              sourceSegmentInfo: { segmentationId, segmentIndex },
            });
          }
        : undefined,
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

    // Check if any segments have anything drawn in any of the viewports
    const hasAnySegmentData = (() => {
      const imageIds = Labelmap.imageIds;
      if (!imageIds?.length) {
        return false;
      }

      for (const imageId of imageIds) {
        const pixelData = cache.getImage(imageId)?.getPixelData();
        if (!pixelData) {
          continue;
        }

        for (let i = 0; i < pixelData.length; i++) {
          if (pixelData[i] !== 0) {
            return true;
          }
        }
      }
      return false;
    })();

    if (!hasAnySegmentData) {
      return { segmentationId, isExportable: false };
    }

    const referencedImageIds = Labelmap.referencedImageIds;
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
    title: `${segmentationRepresentationType ? `${segmentationRepresentationType} ` : ''}Segmentations`,
    exportOptions,
    disableEditing,
    onSegmentationAdd,
    showAddSegment,
    renderInactiveSegmentations: handlers.getRenderInactiveSegmentations(),
    segmentationRepresentationType,
    selectedSegmentationIdForType,
    ...handlers,
  };

  const renderUtilitiesToolbar = () => {
    if (!buttonSection) {
      return null;
    }

    return (
      <IconPresentationProvider
        size="large"
        IconContainer={SegmentationUtilityButton}
      >
        <div className="flex flex-wrap gap-[3px] bg-transparent pb-[2px] pl-[8px] pt-[6px]">
          <Toolbar buttonSection={buttonSection} />
        </div>
      </IconPresentationProvider>
    );
  };

  const renderSegments = () => {
    return (
      <SegmentationTable.Segments>
        <SegmentationTable.SegmentStatistics.Header>
          <CustomSegmentStatisticsHeader />
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
          {renderUtilitiesToolbar()}
          <SegmentationTable.Collapsed.Header>
            <SegmentationTable.Collapsed.DropdownMenu>
              <CustomDropdownMenuContent />
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
          {renderUtilitiesToolbar()}
          <SegmentationTable.Expanded.Header>
            <SegmentationTable.Expanded.DropdownMenu>
              <CustomDropdownMenuContent />
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
    <Popover
      open={!!activeUtilityOptions}
      onOpenChange={handlePopoverOpenChange}
    >
      <PopoverAnchor>
        <SegmentationTable {...tableProps}>
          {children}
          <SegmentationTable.Config />
          <SegmentationTable.AddSegmentationRow />
          {renderModeContent()}
        </SegmentationTable>
      </PopoverAnchor>
      {activeUtilityOptions && (
        <PopoverContent
          side="left"
          align="start"
          className="w-auto"
        >
          <ToolSettings options={activeUtilityOptions} />
        </PopoverContent>
      )}
    </Popover>
  );
}
