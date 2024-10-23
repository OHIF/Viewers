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
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../../components';
import { useSegmentationTableContext } from './SegmentationTableContext';

import { useTranslation } from 'react-i18next';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@ohif/ui-next';

export const SegmentationHeaderExpanded = () => {
  const { t } = useTranslation('SegmentationTable.HeaderExpanded');

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
  } = useSegmentationTableContext('SegmentationTable.HeaderExpanded');

  if (mode !== 'expanded' || !data?.length) {
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
  return (
    <Accordion
      type="single"
      defaultValue={activeSegmentationId}
    >
      <AccordionItem value="tmv1-group">
        <AccordionTrigger className="hover:bg-popover mr-0 flex h-8 w-full items-center pl-0 pr-1">
          <div className="text-foreground border-input flex h-8 w-full items-center justify-between border-t-2">
            <div className="flex items-center space-x-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-1"
                  >
                    <Icons.More className="h-6 w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem>
                    <Icons.Add className="text-foreground" />
                    <span className="pl-2">Add Segment</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Icons.Series className="text-foreground" />
                    <span className="pl-2">Remove from Viewport</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Icons.Rename className="text-foreground" />
                    <span className="pl-2">Rename</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Icons.Hide className="text-foreground" />
                    <span className="pl-2">Hide or Show all Segments</span>
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Icons.Export className="text-foreground" />
                      <span className="pl-2">Export & Download</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem>Export DICOM SEG</DropdownMenuItem>
                        <DropdownMenuItem>Download DICOM SEG</DropdownMenuItem>
                        <DropdownMenuItem>Download DICOM RTSTRUCT</DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Icons.Delete className="text-red-600" />
                    <span className="pl-2 text-red-600">Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="pl-1.5">TMTV1 Segmentation</div>
            </div>
            <div className="mr-1 flex items-center">
              <Button
                variant="ghost"
                size="icon"
              >
                <Icons.Info className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </AccordionTrigger>
      </AccordionItem>
    </Accordion>
  );
};
