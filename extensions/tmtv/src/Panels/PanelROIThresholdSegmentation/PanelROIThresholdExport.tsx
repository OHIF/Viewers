import React, { useEffect } from 'react';
import { useActiveViewportSegmentationRepresentations } from '@ohif/extension-cornerstone';
import { handleROIThresholding } from '../../utils/handleROIThresholding';
import { debounce } from '@ohif/core/src/utils';

export default function PanelRoiThresholdSegmentation({
  servicesManager,
  commandsManager,
}: withAppTypes) {
  const { segmentationService } = servicesManager.services;
  const { segmentationsWithRepresentations: segmentationsInfo } =
    useActiveViewportSegmentationRepresentations({ servicesManager });

  useEffect(() => {
    const segmentationIds = segmentationsInfo.map(
      segmentationInfo => segmentationInfo.segmentation.segmentationId
    );

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
  const tmtvSegmentation = segmentationsInfo.find(
    info => info.segmentation.cachedStats?.tmtv !== undefined
  );
  const tmtvValue = tmtvSegmentation?.segmentation.cachedStats?.tmtv;

  return (
    <div className="mt-2 mb-10 flex flex-col">
      <div className="invisible-scrollbar overflow-y-auto overflow-x-hidden">
        {tmtvValue !== null && tmtvValue !== undefined ? (
          <div className="bg-secondary-dark flex items-baseline justify-between px-2 py-1">
            <span className="text-base font-bold uppercase tracking-widest text-white">
              {'TMTV:'}
            </span>
            <div className="text-white">{`${tmtvValue.toFixed(3)} mL`}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
