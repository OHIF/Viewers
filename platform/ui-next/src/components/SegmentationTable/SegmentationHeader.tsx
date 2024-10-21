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

export const SegmentationHeader: React.FC<{
  segmentation?: any;
  representation?: any;
}> = ({ segmentation, representation }) => {
  if (!segmentation || !representation) {
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
