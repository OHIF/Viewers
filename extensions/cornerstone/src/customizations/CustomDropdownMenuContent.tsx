import React from 'react';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  Icons,
  useSegmentationTableContext,
  useSegmentationExpanded,
} from '@ohif/ui-next';
import { useTranslation } from 'react-i18next';
import { useSystem } from '@ohif/core/src';

/**
 * Custom dropdown menu component for segmentation panel that uses context for data
 */
export const CustomDropdownMenuContent = () => {
  const { commandsManager } = useSystem();
  const { t } = useTranslation('SegmentationTable');
  const {
    onSegmentationAdd,
    onSegmentationRemoveFromViewport,
    onSegmentationEdit,
    onSegmentationDelete,
    exportOptions,
    activeSegmentation,
    activeSegmentationId,
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

  const actions = {
    storeSegmentation: async segmentationId => {
      commandsManager.run({
        commandName: 'storeSegmentation',
        commandOptions: { segmentationId },
        context: 'CORNERSTONE',
      });
    },
    onSegmentationDownloadRTSS: segmentationId => {
      commandsManager.run('downloadRTSS', { segmentationId });
    },
    onSegmentationDownload: segmentationId => {
      commandsManager.run('downloadSegmentation', { segmentationId });
    },
    downloadCSVSegmentationReport: segmentationId => {
      commandsManager.run('downloadCSVSegmentationReport', { segmentationId });
    },
  };

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
        <DropdownMenuSubTrigger className="pl-1">
          <Icons.Export className="text-foreground" />
          <span className="pl-2">{t('Export & Download')}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => actions.downloadCSVSegmentationReport(segmentationId)}>
              {t('Download CSV Report')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => actions.storeSegmentation(segmentationId)}
              disabled={!allowExport}
            >
              {t('Export DICOM SEG')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => actions.onSegmentationDownload(segmentationId)}
              disabled={!allowExport}
            >
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
