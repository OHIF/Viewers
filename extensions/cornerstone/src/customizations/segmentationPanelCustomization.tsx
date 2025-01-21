import React from 'react';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  Icons,
} from '@ohif/ui-next';

export default function getSegmentationPanelCustomization({ commandsManager, servicesManager }) {
  return {
    'panelSegmentation.customDropdownMenuContent': ({
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
    }) => (
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
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onSegmentationDelete(activeSegmentation.segmentationId)}>
          <Icons.Delete className="text-red-600" />
          <span className="pl-2 text-red-600">{t('Delete')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    ),
    'panelSegmentation.disableEditing': false,
    'panelSegmentation.showAddSegment': true,
    'panelSegmentation.onSegmentationAdd': () => {
      const { viewportGridService } = servicesManager.services;
      const viewportId = viewportGridService.getState().activeViewportId;
      commandsManager.run('createLabelmapForViewport', { viewportId });
    },
    'panelSegmentation.tableMode': 'collapsed',
    'panelSegmentation.readableText': {
      lesionStats: 'Lesion Statistics',
      minValue: 'Minimum Value',
      maxValue: 'Maximum Value',
      meanValue: 'Mean Value',
      volume: 'Volume (ml)',
      suvPeak: 'SUV Peak',
      suvMax: 'Maximum SUV',
      suvMaxIJK: 'SUV Max IJK',
      lesionGlyoclysisStats: 'Lesion Glycolysis',
    },
  };
}
