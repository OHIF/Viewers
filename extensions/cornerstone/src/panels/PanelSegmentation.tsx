import React from 'react';
import { SegmentationTable } from '@ohif/ui-next';
import { useActiveViewportSegmentationRepresentations } from '../hooks/useActiveViewportSegmentationRepresentations';
import { metaData } from '@cornerstonejs/core';

export default function PanelSegmentation({
  servicesManager,
  commandsManager,
  children,
}: withAppTypes) {
  const { customizationService, displaySetService } = servicesManager.services;

  const { segmentationsWithRepresentations, disabled } =
    useActiveViewportSegmentationRepresentations({
      servicesManager,
    });

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

    storeSegmentation: async segmentationId => {
      commandsManager.run('storeSegmentation', { segmentationId });
    },

    onSegmentationDownloadRTSS: segmentationId => {
      commandsManager.run('downloadRTSS', { segmentationId });
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

  const segmentationTableMode = customizationService.getCustomization(
    'panelSegmentation.tableMode'
  );

  // custom onSegmentationAdd if provided
  const onSegmentationAdd = customizationService.getCustomization(
    'panelSegmentation.onSegmentationAdd'
  );

  const disableEditing = customizationService.getCustomization('panelSegmentation.disableEditing');
  const showAddSegment = customizationService.getCustomization('panelSegmentation.showAddSegment');
  const CustomDropdownMenuContent = customizationService.getCustomization(
    'panelSegmentation.customDropdownMenuContent'
  );

  const exportOptions = segmentationsWithRepresentations.map(({ segmentation }) => {
    const { representationData, segmentationId } = segmentation;
    const { Labelmap } = representationData;

    if (!Labelmap) {
      return {
        segmentationId,
        isExportable: true,
      };
    }

    const referencedImageIds = Labelmap.referencedImageIds;
    const firstImageId = referencedImageIds[0];

    const instance = metaData.get('instance', firstImageId);

    if (!instance) {
      return {
        segmentationId,
        isExportable: false,
      };
    }

    const SOPInstanceUID = instance.SOPInstanceUID || instance.SopInstanceUID;
    const SeriesInstanceUID = instance.SeriesInstanceUID;

    const displaySet = displaySetService.getDisplaySetForSOPInstanceUID(
      SOPInstanceUID,
      SeriesInstanceUID
    );

    const isExportable = displaySet?.isReconstructable;

    return {
      segmentationId,
      isExportable,
    };
  });

  return (
    <>
      <SegmentationTable
        disabled={disabled}
        data={segmentationsWithRepresentations}
        mode={segmentationTableMode}
        title="Segmentations"
        exportOptions={exportOptions}
        disableEditing={disableEditing}
        onSegmentationAdd={onSegmentationAdd}
        onSegmentationClick={handlers.onSegmentationClick}
        onSegmentationDelete={handlers.onSegmentationDelete}
        showAddSegment={showAddSegment}
        onSegmentAdd={handlers.onSegmentAdd}
        onSegmentClick={handlers.onSegmentClick}
        onSegmentEdit={handlers.onSegmentEdit}
        onSegmentationEdit={handlers.onSegmentationEdit}
        onSegmentColorClick={handlers.onSegmentColorClick}
        onSegmentDelete={handlers.onSegmentDelete}
        onToggleSegmentVisibility={handlers.onToggleSegmentVisibility}
        onToggleSegmentLock={handlers.onToggleSegmentLock}
        onToggleSegmentationRepresentationVisibility={
          handlers.onToggleSegmentationRepresentationVisibility
        }
        onSegmentationDownload={handlers.onSegmentationDownload}
        storeSegmentation={handlers.storeSegmentation}
        onSegmentationDownloadRTSS={handlers.onSegmentationDownloadRTSS}
        setStyle={handlers.setStyle}
        toggleRenderInactiveSegmentations={handlers.toggleRenderInactiveSegmentations}
        onSegmentationRemoveFromViewport={handlers.onSegmentationRemoveFromViewport}
        setFillAlpha={handlers.setFillAlpha}
        setOutlineWidth={handlers.setOutlineWidth}
        setRenderFill={handlers.setRenderFill}
        setRenderOutline={handlers.setRenderOutline}
        setFillAlphaInactive={handlers.setFillAlphaInactive}
        renderInactiveSegmentations={handlers.getRenderInactiveSegmentations()}
      >
        {children}
        <SegmentationTable.Config />
        <SegmentationTable.AddSegmentationRow />

        {segmentationTableMode === 'collapsed' ? (
          <SegmentationTable.Collapsed>
            <SegmentationTable.SelectorHeader>
              <CustomDropdownMenuContent />
            </SegmentationTable.SelectorHeader>
            <SegmentationTable.AddSegmentRow />
            <SegmentationTable.Segments />
          </SegmentationTable.Collapsed>
        ) : (
          <SegmentationTable.Expanded>
            <SegmentationTable.Header>
              <CustomDropdownMenuContent />
            </SegmentationTable.Header>
            {/* <SegmentationTable.AddSegmentRow /> */}
            <SegmentationTable.Segments />
          </SegmentationTable.Expanded>
        )}
      </SegmentationTable>
    </>
  );
}
