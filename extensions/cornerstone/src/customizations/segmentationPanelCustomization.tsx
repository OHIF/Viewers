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
  useSegmentationTableContext,
  useSegmentationExpanded,
} from '@ohif/ui-next';
import { useTranslation } from 'react-i18next';

export default function getSegmentationPanelCustomization({ commandsManager, servicesManager }) {
  // Custom dropdown menu component that uses context for data
  const CustomDropdownMenuContent = () => {
    const { t } = useTranslation('SegmentationTable');
    const {
      onSegmentationAdd,
      onSegmentationRemoveFromViewport,
      onSegmentationEdit,
      onSegmentationDelete,
      exportOptions,
      storeSegmentation,
      onSegmentationDownload,
      onSegmentationDownloadRTSS,
    } = useSegmentationTableContext('CustomDropdownMenu');

    // Try to get segmentation data from expanded context first, fall back to table context
    let segmentation;
    let segmentationId;
    let allowExport = false;

    try {
      // Try to get from expanded context
      const context = useSegmentationExpanded();
      segmentation = context.segmentation;
      segmentationId = segmentation.segmentationId;
    } catch (e) {
      // If not in expanded context, fallback to active segmentation from table context
      const { activeSegmentation, activeSegmentationId } =
        useSegmentationTableContext('CustomDropdownMenu');
      segmentation = activeSegmentation;
      segmentationId = activeSegmentationId;
    }

    // Determine if export is allowed for this segmentation
    if (exportOptions && segmentationId) {
      const exportOption = exportOptions.find(opt => opt.segmentationId === segmentationId);
      allowExport = exportOption?.isExportable || false;
    }

    if (!segmentation || !segmentationId) {
      return null;
    }

    return (
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => onSegmentationAdd(segmentationId)}>
          <Icons.Add className="text-foreground" />
          <span className="pl-2">{t('Create New Segmentation')}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t('Manage Current Segmentation')}</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onSegmentationRemoveFromViewport(segmentationId)}>
          <Icons.Series className="text-foreground" />
          <span className="pl-2">{t('Remove from Viewport')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSegmentationEdit(segmentationId)}>
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
              <DropdownMenuItem onClick={() => storeSegmentation(segmentationId)}>
                {t('Export DICOM SEG')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSegmentationDownload(segmentationId)}>
                {t('Download DICOM SEG')}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onSegmentationDelete(segmentationId)}>
          <Icons.Delete className="text-red-600" />
          <span className="pl-2 text-red-600">{t('Delete')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    );
  };

  return {
    'panelSegmentation.customDropdownMenuContent': CustomDropdownMenuContent,
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
