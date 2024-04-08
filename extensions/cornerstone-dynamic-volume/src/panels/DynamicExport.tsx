import React, { useState, useEffect } from 'react';
import { LegacyButtonGroup, LegacyButton } from '@ohif/ui';
import { useTranslation } from 'react-i18next';

function DynamicExport({ commandsManager, servicesManager, extensionManager }) {
  const { segmentationService } = servicesManager.services;
  const { t } = useTranslation('dynamicExport');

  const [segmentations, setSegmentations] = useState(() => segmentationService.getSegmentations());

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
      {segmentations?.length ? (
        <div className="mt-4 flex justify-center space-x-2">
          {/* TODO Revisit design of LegacyButtonGroup later - for now use LegacyButton for its children.*/}
          <LegacyButtonGroup
            color="black"
            size="inherit"
          >
            <LegacyButton
              className="px-2 py-2 text-base"
              onClick={() => {
                commandsManager.runCommand('exportTimeReportCSV', {
                  segmentations,
                  options: {
                    filename: 'TimeData.csv',
                  },
                });
              }}
            >
              {t('Export Time Data')}
            </LegacyButton>
          </LegacyButtonGroup>
          <LegacyButtonGroup
            color="black"
            size="inherit"
          >
            <LegacyButton
              className="px-2 py-2 text-base"
              onClick={() => {
                commandsManager.runCommand('exportTimeReportCSV', {
                  segmentations,
                  summaryStats: true,
                  options: {
                    filename: 'ROIStats.csv',
                  },
                });
              }}
            >
              {t('Export ROI Stats')}
            </LegacyButton>
          </LegacyButtonGroup>
        </div>
      ) : null}
    </div>
  );
}

export default DynamicExport;
