import React from 'react';
import {
  Icons,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '../../components';

import { useTranslation } from 'react-i18next';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@ohif/ui-next';
import { useSegmentationTableContext } from './SegmentationTableContext';

export const SegmentationSelectorHeader: React.FC<{ children?: React.ReactNode }> = ({
  children = null,
}) => {
  const { t } = useTranslation('SegmentationTable.HeaderCollapsed');

  const { data, activeSegmentationId, mode, onSegmentationClick, exportOptions, ...contextProps } =
    useSegmentationTableContext('SegmentationTable.HeaderCollapsed');

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

  const childrenWithProps = React.Children.map(children, child =>
    React.isValidElement(child)
      ? React.cloneElement(child, {
          activeSegmentation,
          allowExport,
          t,
          ...contextProps,
        })
      : child
  );

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
        {childrenWithProps}
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
