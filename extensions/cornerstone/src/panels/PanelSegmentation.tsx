import React from 'react';
import {
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  Icons,
  SegmentationTable,
  DropdownMenuSubTrigger,
} from '@ohif/ui-next';
import { useActiveViewportSegmentationRepresentations } from '../hooks/useActiveViewportSegmentationRepresentations';
import { metaData } from '@cornerstonejs/core';

export default function PanelSegmentation({
  servicesManager,
  commandsManager,
  children,
}: withAppTypes) {
  const { customizationService, viewportGridService, displaySetService } = servicesManager.services;

  const { segmentationsWithRepresentations, disabled } =
    useActiveViewportSegmentationRepresentations({
      servicesManager,
    });

  const handlers = {
    onSegmentationAdd: async () => {
      const viewportId = viewportGridService.getState().activeViewportId;
      commandsManager.run('createLabelmapForViewport', { viewportId });
    },

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

  const { mode: SegmentationTableMode } = customizationService.getCustomization(
    'PanelSegmentation.tableMode',
    {
      id: 'default.segmentationTable.mode',
      mode: 'collapsed',
    }
  );

  // custom onSegmentationAdd if provided
  const { onSegmentationAdd } = customizationService.getCustomization(
    'PanelSegmentation.onSegmentationAdd',
    {
      id: 'segmentation.onSegmentationAdd',
      onSegmentationAdd: handlers.onSegmentationAdd,
    }
  );

  const { disableEditing } = customizationService.getCustomization(
    'PanelSegmentation.disableEditing',
    {
      id: 'default.disableEditing',
      disableEditing: false,
    }
  );

  const { showAddSegment } = customizationService.getCustomization(
    'PanelSegmentation.showAddSegment',
    {
      id: 'default.showAddSegment',
      showAddSegment: true,
    }
  );

  const CustomDropdownMenuContent = customizationService.getCustomComponent(
    'PanelSegmentation.CustomDropdownMenuContent',
    ({
      activeSegmentation,
      onSegmentationAdd,
      onSegmentationRemoveFromViewport,
      onSegmentationEdit,
      onSegmentationDelete,
      allowExport,
      storeSegmentation,
      onSegmentationDownload,
      onSegmentationDownloadRTSS,
      t,
    }) => {
      return (
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => onSegmentationAdd(activeSegmentation.segmentationId)}>
            <Icons.Add className="text-foreground" />
            <span className="pl-2">{t('Create New Segmentation')}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>{t('Manage Current Segmentation')}</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => onSegmentationRemoveFromViewport(activeSegmentation.segmentationId)}
          >
            <Icons.Series className="text-foreground" />
            <span className="pl-2">{t('Remove from Viewport')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSegmentationEdit(activeSegmentation.segmentationId)}>
            <Icons.Rename className="text-foreground" />
            <span className="pl-2">{t('Rename')}</span>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              disabled={!allowExport}
              className="pl-1"
            >
              <Icons.Export className="text-foreground" />
              <span className="pl-2">{t('Export & Download')}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={() => storeSegmentation(activeSegmentation.segmentationId)}
                >
                  {t('Export DICOM SEG')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onSegmentationDownload(activeSegmentation.segmentationId)}
                >
                  {t('Download DICOM SEG')}
                </DropdownMenuItem>
                {/* <DropdownMenuItem
                  onClick={() => onSegmentationDownloadRTSS(activeSegmentation.segmentationId)}
                >
                  {t('Download DICOM RTSTRUCT')}
                </DropdownMenuItem> */}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onSegmentationDelete(activeSegmentation.segmentationId)}>
            <Icons.Delete className="text-red-600" />
            <span className="pl-2 text-red-600">{t('Delete')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      );
    }
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
        mode={SegmentationTableMode}
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

        {SegmentationTableMode === 'collapsed' ? (
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
