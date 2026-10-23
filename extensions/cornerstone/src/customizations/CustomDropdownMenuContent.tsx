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

  // Prefer the expanded context when rendered inside one, otherwise fall back to
  // the active segmentation from the table context. useSegmentationExpanded returns
  // undefined outside a provider rather than throwing, so no try/catch is needed -
  // catching it would put a hook call inside a try block, which breaks the rules of
  // hooks and makes the React Compiler bail on the whole component.
  const expandedContext = useSegmentationExpanded();
  const segmentation = expandedContext ? expandedContext.segmentation : activeSegmentation;
  const segmentationId = expandedContext
    ? expandedContext.segmentation.segmentationId
    : activeSegmentationId;
  let allowExport = false;

  if (!segmentation || !segmentationId) {
    return null;
  }

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
          <span className="pl-2">{t('Create New Segmentation')}</span>
        </DropdownMenuItem>
      )}
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
