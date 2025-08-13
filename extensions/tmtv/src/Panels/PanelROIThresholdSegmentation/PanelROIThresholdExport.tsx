import React, { useEffect } from 'react';
import { useActiveViewportSegmentationRepresentations } from '@ohif/extension-cornerstone';
import { handleROIThresholding } from '../../utils/handleROIThresholding';
import { debounce } from '@ohif/core/src/utils';
import { useSystem } from '@ohif/core/src';
import { Button } from '@ohif/ui-next';

export default function PanelRoiThresholdSegmentation() {
  const { commandsManager, servicesManager } = useSystem();
  const { segmentationService } = servicesManager.services;
  const { segmentationsWithRepresentations: segmentationsInfo } =
    useActiveViewportSegmentationRepresentations();

  const segmentationIds = segmentationsInfo?.map(info => info.segmentation.segmentationId) || [];
  const segmentations = segmentationsInfo?.map(info => info.segmentation) || [];

  useEffect(() => {
    const initialRun = async () => {
      for (const segmentationId of segmentationIds) {
        await handleROIThresholding({
          segmentationId,
          commandsManager,
          segmentationService,
        });
      }
    };

    initialRun();
  }, []);

  useEffect(() => {
    const debouncedHandleROIThresholding = debounce(async eventDetail => {
      const { segmentationId } = eventDetail;
      await handleROIThresholding({
        segmentationId,
        commandsManager,
        segmentationService,
      });
    }, 100);

    const dataModifiedCallback = eventDetail => {
      debouncedHandleROIThresholding(eventDetail);
    };

    const dataModifiedSubscription = segmentationService.subscribe(
      segmentationService.EVENTS.SEGMENTATION_DATA_MODIFIED,
      dataModifiedCallback
    );

    return () => {
      dataModifiedSubscription.unsubscribe();
    };
  }, [commandsManager, segmentationService]);

  // Find the first segmentation with a TMTV value since all of them have the same value
  const stats = segmentationService.getSegmentationGroupStats(segmentationIds);
  const tmtvValue = stats?.tmtv;

  const handleExportCSV = () => {
    if (!segmentations.length) {
      return;
    }

    commandsManager.runCommand('exportTMTVReportCSV', {
      segmentations,
      tmtv: tmtvValue,
      config: {},
    });
  };

  return (
    <div className="mb-1 flex flex-col">
      <div className="invisible-scrollbar overflow-y-auto overflow-x-hidden">
        <div className="bg-secondary-dark flex items-baseline justify-between px-2 py-1">
          <div className="py-1">
            <span className="text-muted-foreground text-base font-bold uppercase">{'TMTV: '}</span>
            <span className="text-foreground">{tmtvValue ? `${tmtvValue.toFixed(3)} mL` : ''}</span>
          </div>
          <div className="flex items-center">
            <Button
              dataCY="exportTmtvCsvReport"
              size="sm"
              variant="ghost"
              className="text-blue-500"
              onClick={handleExportCSV}
            >
              <span className="pl-1">CSV</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
