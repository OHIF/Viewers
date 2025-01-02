import React from 'react';
import { Button } from '../Button';
import { Icons } from '../Icons/Icons';
import { DropdownMenu, DropdownMenuTrigger } from '../DropdownMenu';
import { Tooltip, TooltipTrigger, TooltipContent } from '../Tooltip/Tooltip';
import { useSegmentationTableContext } from './SegmentationTableContext';
import { useTranslation } from 'react-i18next';

export const SegmentationHeader: React.FC<{
  children?: React.ReactNode;
  segmentation?: any;
}> = ({ children, segmentation }) => {
  const { t } = useTranslation('SegmentationTable');
  const { ...contextProps } = useSegmentationTableContext('SegmentationHeader');

  if (!segmentation) {
    return null;
  }

  const childrenWithProps = React.Children.map(children, child =>
    React.isValidElement(child)
      ? React.cloneElement(child, {
          t,
          ...contextProps,
        })
      : child
  );

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
          {childrenWithProps}
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
