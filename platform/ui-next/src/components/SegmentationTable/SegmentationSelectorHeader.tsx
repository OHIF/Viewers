import React from 'react';
import {
  Icons,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  DropdownMenuLabel,
} from '../../components';

import { useTranslation } from 'react-i18next';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@ohif/ui-next';
import { useSegmentationTableContext } from './SegmentationTableContext';

export const SegmentationSelectorHeader: React.FC<{ children?: React.ReactNode }> = ({
  children = null,
}) => {
  const { t } = useTranslation('SegmentationTable.HeaderCollapsed');

  const {
    data,
    activeSegmentationId,
    mode,
    onSegmentationClick,
    onSegmentationAdd,
    onSegmentationRemoveFromViewport,
    onSegmentationEdit,
    onSegmentationDelete,
    onSegmentationDownload,
    onSegmentationDownloadRTSS,
    storeSegmentation,
    exportOptions,
  } = useSegmentationTableContext('SegmentationTable.HeaderCollapsed');

  if (mode !== 'collapsed' || !data?.length) {
    return null;
  }

  const activeSegmentationObj = data.find(
    seg => seg.segmentation.segmentationId === activeSegmentationId
  );

  const activeSegmentation = {
    id: activeSegmentationObj?.segmentation.segmentationId,
    label: activeSegmentationObj?.segmentation.label,
    info: activeSegmentationObj?.segmentation.cachedStats?.info,
  };

  const segmentations = data.map(seg => ({
    id: seg.segmentation.segmentationId,
    label: seg.segmentation.label,
    info: seg.segmentation.cachedStats?.info,
  }));

  const allowExport = exportOptions?.find(
    ({ segmentationId }) => segmentationId === activeSegmentation.id
  )?.isExportable;

  return (
    <div className="bg-primary-dark flex h-10 w-full items-center space-x-1 rounded-t px-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
          >
            <Icons.More className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => onSegmentationAdd(activeSegmentation.id)}>
            <Icons.Add className="text-foreground" />
            <span className="pl-2">{t('Create New Segmentation')}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>{t('Manage Current Segmentation')}</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onSegmentationRemoveFromViewport(activeSegmentation.id)}>
            <Icons.Series className="text-foreground" />
            <span className="pl-2">{t('Remove from Viewport')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSegmentationEdit(activeSegmentation.id)}>
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
                <DropdownMenuItem onClick={() => storeSegmentation(activeSegmentation.id)}>
                  {t('Export DICOM SEG')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSegmentationDownload(activeSegmentation.id)}>
                  {t('Download DICOM SEG')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSegmentationDownloadRTSS(activeSegmentation.id)}>
                  {t('Download DICOM RTSTRUCT')}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onSegmentationDelete(activeSegmentation.id)}>
            <Icons.Delete className="text-red-600" />
            <span className="pl-2 text-red-600">{t('Delete')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Select
        onValueChange={value => onSegmentationClick(value)}
        value={activeSegmentation.id}
      >
        <SelectTrigger className="w-full overflow-hidden">
          <SelectValue placeholder={t('Select a segmentation')} />
        </SelectTrigger>
        <SelectContent>
          {segmentations.map(seg => (
            <SelectItem
              key={seg.id}
              value={seg.id}
            >
              {seg.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
          >
            <Icons.Info className="h-6 w-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="end"
        >
          {activeSegmentation.info}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
