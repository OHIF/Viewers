import React, { useState, useEffect } from 'react';
import { ActionButtons } from '@ohif/ui';
import { useTranslation } from 'react-i18next';

function DynamicExport({ commandsManager, servicesManager, extensionManager }: withAppTypes) {
  const { segmentationService } = servicesManager.services;
  const { t } = useTranslation('dynamicExport');

  const [segmentations, setSegmentations] = useState(() => segmentationService.getSegmentations());

  const actions = [
    {
      label: 'Export Time Data',
      onClick: () => {
        commandsManager.runCommand('exportTimeReportCSV', {
          segmentations,
          options: {
            filename: 'TimeData.csv',
          },
        });
      },
      disabled: !segmentations?.length,
    },
    {
      label: 'Export ROI Stats',
      onClick: () => {
        commandsManager.runCommand('exportTimeReportCSV', {
          segmentations,
          summaryStats: true,
          options: {
            filename: 'ROIStats.csv',
          },
        });
      },
      disabled: !segmentations?.length,
    },
  ];

  /**
   * Update UI based on segmentation changes (added, removed, updated)
   */
  useEffect(() => {
    // ~~ Subscription
    const added = segmentationService.EVENTS.SEGMENTATION_ADDED;
    const updated = segmentationService.EVENTS.SEGMENTATION_UPDATED;
    const removed = segmentationService.EVENTS.SEGMENTATION_REMOVED;
    const subscriptions = [];

    [added, updated, removed].forEach(evt => {
      const { unsubscribe } = segmentationService.subscribe(evt, () => {
        const segmentations = segmentationService.getSegmentations();
        setSegmentations(segmentations);
      });
      subscriptions.push(unsubscribe);
    });

    return () => {
      subscriptions.forEach(unsub => {
        unsub();
      });
    };
  }, []);

  return (
    <div>
      <div className="mt-3 flex justify-center px-2">
        <ActionButtons
          actions={actions}
          t={t}
        />
      </div>
    </div>
  );
}

export default DynamicExport;
