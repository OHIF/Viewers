import React from 'react';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Icons,
  useSegmentationTableContext,
  useSegmentationExpanded,
} from '@ohif/ui-next';
import { useTranslation } from 'react-i18next';
import { useSystem } from '@ohif/core/src';
import { ExportSegmentationSubMenuItem } from '../components/ExportSegmentationSubMenuItem';

/**
 * Custom dropdown menu component for segmentation panel that uses context for data
 */
export const CustomDropdownMenuContent = () => {
  const { commandsManager } = useSystem();
  const { t } = useTranslation('SegmentationPanel');
  const {
    onSegmentationAdd,
    onSegmentationRemoveFromViewport,
    onSegmentationEdit,
    onSegmentationDelete,
    exportOptions,
    activeSegmentation,
    activeSegmentationId,
    segmentationRepresentationTypes,
    disableEditing,
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

  if (!segmentation || !segmentationId) {
    return null;
  }

  const isLabelMap = segmentationRepresentationTypes?.[0] === 'Labelmap';
  const createLabel = isLabelMap
    ? `Create New ${t('Labelmap')} ${t('Segmentation')}`
    : t('Create New Segmentation');
  const manageLabel = isLabelMap
    ? `Manage Current ${t('Labelmap')} ${t('Segmentation')}`
    : t('Manage Current Segmentation');

  // Determine if export is allowed for this segmentation
  if (exportOptions) {
    const exportOption = exportOptions.find(opt => opt.segmentationId === segmentationId);
    allowExport = exportOption?.isExportable || false;
  }

  const actions = {
    storeSegmentation: async (segmentationId, modality = 'SEG') => {
      commandsManager.run({
        commandName: 'storeSegmentation',
        commandOptions: { segmentationId, modality },
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
      {!disableEditing && (
        <DropdownMenuItem
          onClick={() =>
            onSegmentationAdd({
              segmentationId,
              segmentationRepresentationType: segmentationRepresentationTypes?.[0],
            })
          }
        >
          <Icons.Add className="text-foreground" />
          <span className="pl-2">{createLabel}</span>
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuLabel>{manageLabel}</DropdownMenuLabel>
      <DropdownMenuItem onClick={() => onSegmentationRemoveFromViewport(segmentationId)}>
        <Icons.Series className="text-foreground" />
        <span className="pl-2">{t('Remove from Viewport')}</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onSegmentationEdit(segmentationId)}>
        <Icons.Rename className="text-foreground" />
        <span className="pl-2">{t('Rename')}</span>
      </DropdownMenuItem>
      <ExportSegmentationSubMenuItem
        segmentationId={segmentationId}
        segmentationRepresentationType={segmentationRepresentationTypes?.[0]}
        allowExport={allowExport}
        actions={actions}
      />
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onSegmentationDelete(segmentationId)}>
        <Icons.Delete className="text-red-600" />
        <span className="pl-2 text-red-600">{t('Delete')}</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
};
