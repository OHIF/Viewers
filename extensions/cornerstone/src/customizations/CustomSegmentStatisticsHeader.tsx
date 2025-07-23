import * as cornerstoneTools from '@cornerstonejs/tools';
import React from 'react';
import { Separator, Button, Tooltip, TooltipTrigger, TooltipContent, Icons } from '@ohif/ui-next';
import { useTranslation } from 'react-i18next';
import { roundNumber } from '@ohif/core/src/utils';
import { useSystem } from '@ohif/core/src';

interface CustomSegmentStatisticsHeaderProps {
  segmentationId: string;
  segmentIndex: number;
}

/**
 * Custom header component for segment statistics
 */
export const CustomSegmentStatisticsHeader = ({
  segmentationId,
  segmentIndex,
}: CustomSegmentStatisticsHeaderProps) => {
  const { servicesManager, commandsManager } = useSystem();
  const { segmentationService } = servicesManager.services;
  const { t } = useTranslation('SegmentationTable');

  const segmentation = segmentationService.getSegmentation(segmentationId);
  const segment = segmentation.segments[segmentIndex];
  const cachedStats = segment.cachedStats;
  const namedStats = cachedStats.namedStats;

  if (!namedStats) {
    return null;
  }

  const bidirectional = namedStats.bidirectional;

  if (!bidirectional) {
    return (
      <div className="-mt-2 space-y-2">
        <div className="flex">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary flex items-center gap-2"
                onClick={() => {
                  commandsManager.run('runSegmentBidirectional', {
                    segmentationId,
                    segmentIndex,
                  });
                }}
              >
                <Icons.ToolBidirectionalSegment className="h-5 w-5" />
                <span>{t('Compute Largest Bidirectional')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('Add bidirectional measurement')}</TooltipContent>
          </Tooltip>
        </div>
        <Separator className="bg-input" />
      </div>
    );
  }

  const { value, unit } = bidirectional;
  const maxMajor = value.maxMajor;
  const maxMinor = value.maxMinor;

  const max = Math.max(maxMajor, maxMinor);
  const min = Math.min(maxMajor, maxMinor);

  const isVisible = cornerstoneTools.annotation.visibility.isAnnotationVisible(
    bidirectional.annotationUID
  );

  return (
    <div className="-mt-2 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-foreground">
          <div>
            L: {roundNumber(max)} {unit}
          </div>
          <div>
            W: {roundNumber(min)} {unit}
          </div>
        </div>
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className={`h-6 w-6 transition-opacity`}
                onClick={e => {
                  e.stopPropagation();
                  cornerstoneTools.annotation.visibility.setAnnotationVisibility(
                    bidirectional.annotationUID,
                    !isVisible
                  );

                  segmentationService.addOrUpdateSegmentation({
                    segmentationId,
                    segmentIndex,
                  });
                }}
              >
                {isVisible ? (
                  <Icons.Hide className="h-6 w-6" />
                ) : (
                  <Icons.Show className="h-6 w-6" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('Toggle visibility')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (bidirectional.annotationUID) {
                    commandsManager.run('jumpToMeasurement', {
                      uid: bidirectional.annotationUID,
                    });
                  }
                }}
              >
                <Icons.JumpToSlice />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('Jump to measurement')}</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <Separator className="bg-input" />
    </div>
  );
};
