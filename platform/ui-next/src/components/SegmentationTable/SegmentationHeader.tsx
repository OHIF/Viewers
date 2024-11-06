import React from 'react';
import { Button } from '../Button';
import { Icons } from '../Icons/Icons';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '../DropdownMenu';
import { Tooltip, TooltipTrigger, TooltipContent } from '../Tooltip/Tooltip';
import { useSegmentationTableContext } from './SegmentationTableContext';
import { useTranslation } from 'react-i18next';

export const SegmentationHeader: React.FC<{
  segmentation?: any;
}> = ({ segmentation }) => {
  const { t } = useTranslation('SegmentationTable');
  const {
    onSegmentAdd,
    onSegmentationRemoveFromViewport,
    onSegmentationEdit,
    onSegmentationDelete,
    onSegmentationDownload,
    onSegmentationDownloadRTSS,
    storeSegmentation,
  } = useSegmentationTableContext('SegmentationHeader');

  if (!segmentation) {
    return null;
  }

  return (
    <div className="text-foreground flex h-8 w-full items-center justify-between">
      <div className="flex items-center space-x-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="ml-1"
              onClick={e => e.stopPropagation()}
            >
              <Icons.More />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation();
                onSegmentAdd(segmentation.segmentationId);
              }}
            >
              <Icons.Add className="text-foreground" />
              <span className="pl-2">{t('Add Segment')}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation();
                onSegmentationRemoveFromViewport(segmentation.segmentationId);
              }}
            >
              <Icons.Series className="text-foreground" />
              <span className="pl-2">{t('Remove from Viewport')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation();
                onSegmentationEdit(segmentation.segmentationId);
              }}
            >
              <Icons.Rename className="text-foreground" />
              <span className="pl-2">{t('Rename')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={e => e.stopPropagation()}>
              <Icons.Hide className="text-foreground" />
              <span className="pl-2">{t('Hide or Show all Segments')}</span>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger onClick={e => e.stopPropagation()}>
                <Icons.Export className="text-foreground" />
                <span className="pl-2">{t('Export & Download')}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      storeSegmentation(segmentation.segmentationId);
                    }}
                  >
                    {t('Export DICOM SEG')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      onSegmentationDownload(segmentation.segmentationId);
                    }}
                  >
                    {t('Download DICOM SEG')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      onSegmentationDownloadRTSS(segmentation.segmentationId);
                    }}
                  >
                    {t('Download DICOM RTSTRUCT')}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSegmentationDelete(segmentation.segmentationId)}>
              <Icons.Delete className="text-red-600" />
              <span className="pl-2 text-red-600">{t('Delete')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="pl-1.5">{segmentation.label}</div>
      </div>
      <div className="mr-1 flex items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
            >
              <Icons.Info className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{segmentation.cachedStats.info}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
