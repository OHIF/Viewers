import * as cornerstoneTools from '@cornerstonejs/tools';
import React, { useEffect, useState } from 'react';
import { Separator, Button, Tooltip, TooltipTrigger, TooltipContent, Icons } from '@ohif/ui-next';
import { useTranslation } from 'react-i18next';
import { useSystem, utils } from '@ohif/core';

const { roundNumber } = utils;

interface CustomSegmentStatisticsHeaderProps {
  segmentationId: string;
  segmentIndex: number;
}

/**
 * Reads the stats this header shows from the segmentation service. The values
 * live outside React, so the header keeps a copy in state (see below).
 */
function getHeaderStats(segmentationService, segmentationId: string, segmentIndex: number) {
  const segment = segmentationService.getSegmentation(segmentationId)?.segments[segmentIndex];
  const namedStats = segment?.cachedStats?.namedStats;
  const bidirectional = namedStats?.bidirectional;

  return {
    namedStats,
    bidirectional,
    isVisible: bidirectional
      ? cornerstoneTools.annotation.visibility.isAnnotationVisible(bidirectional.annotationUID)
      : false,
  };
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
  const { t } = useTranslation('SegmentationPanel');

  // The props never change while the card is open, so reading the service
  // during render would show the values from the moment the card opened.
  // Keep them in state and refresh them when the segmentation is modified,
  // e.g. after "Compute Largest Bidirectional" or a visibility toggle.
  const [headerStats, setHeaderStats] = useState(() =>
    getHeaderStats(segmentationService, segmentationId, segmentIndex)
  );

  useEffect(() => {
    const { unsubscribe } = segmentationService.subscribe(
      segmentationService.EVENTS.SEGMENTATION_MODIFIED,
      ({ segmentationId: modifiedSegmentationId }) => {
        if (modifiedSegmentationId === segmentationId) {
          setHeaderStats(getHeaderStats(segmentationService, segmentationId, segmentIndex));
        }
      }
    );
    return unsubscribe;
  }, [segmentationService, segmentationId, segmentIndex]);

  const { namedStats, bidirectional, isVisible } = headerStats;

  if (!namedStats) {
    return null;
  }

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
                dataCY="segment-bidirectional-compute"
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

  return (
    <div className="-mt-2 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-foreground">
          <div data-cy="segment-bidirectional-length">
            L: {roundNumber(max)} {unit}
          </div>
          <div data-cy="segment-bidirectional-width">
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
                  setHeaderStats(getHeaderStats(segmentationService, segmentationId, segmentIndex));
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
                dataCY="segment-bidirectional-jump"
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
