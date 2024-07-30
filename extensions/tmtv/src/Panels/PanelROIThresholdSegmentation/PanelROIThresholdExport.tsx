import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Icon, ActionButtons } from '@ohif/ui';
import { useTranslation } from 'react-i18next';
import { eventTarget } from '@cornerstonejs/core';
import { Enums } from '@cornerstonejs/tools';
import { handleROIThresholding } from '../../utils/handleROIThresholding';

export default function PanelRoiThresholdSegmentation({
  servicesManager,
  commandsManager,
}: withAppTypes) {
  const { segmentationService, uiNotificationService } = servicesManager.services;
  const { t } = useTranslation('PanelSUVExport');

  const [segmentations, setSegmentations] = useState(() => segmentationService.getSegmentations());
  const [activeSegmentation, setActiveSegmentation] = useState(null);

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

        const activeSegmentation = segmentations.filter(seg => seg.isActive);
        setActiveSegmentation(activeSegmentation[0]);
      });

      subscriptions.push(unsubscribe);
    });

    return () => {
      subscriptions.forEach(unsub => {
        unsub();
      });
    };
  }, []);

  useEffect(() => {
    const callback = async evt => {
      const { detail } = evt;
      const { segmentationId } = detail;

      if (!segmentationId) {
        return;
      }

      await handleROIThresholding({
        segmentationId,
        commandsManager,
        segmentationService,
      });

      const segmentation = segmentationService.getSegmentation(segmentationId);

      const { cachedStats } = segmentation;
      if (!cachedStats) {
        return;
      }

      // segment 1
      const suvPeak = cachedStats?.['1']?.suvPeak?.suvPeak;

      if (Number.isNaN(suvPeak)) {
        uiNotificationService.show({
          title: 'SUV Peak',
          message: 'Segmented volume does not allow SUV Peak calculation',
          type: 'warning',
        });
      }
    };

    eventTarget.addEventListenerDebounced(Enums.Events.SEGMENTATION_DATA_MODIFIED, callback, 250);

    return () => {
      eventTarget.removeEventListenerDebounced(Enums.Events.SEGMENTATION_DATA_MODIFIED, callback);
    };
  }, []);

  if (!activeSegmentation) {
    return null;
  }

  const tmtvValue = activeSegmentation.cachedStats?.tmtv?.value || null;
  const config = activeSegmentation.cachedStats?.tmtv?.config || {};

  const actions = [
    {
      label: 'Export CSV',
      onClick: () => {
        commandsManager.runCommand('exportTMTVReportCSV', {
          segmentations,
          tmtv: tmtvValue,
          config,
        });
      },
      disabled: tmtvValue === null,
    },
    {
      label: 'Export RT Report',
      onClick: () => {
        commandsManager.runCommand('createTMTVRTReport');
      },
      disabled: tmtvValue === null,
    },
  ];

  return (
    <>
      <div className="mt-2 mb-10 flex flex-col">
        <div className="invisible-scrollbar overflow-y-auto overflow-x-hidden">
          {tmtvValue !== null ? (
            <div className="bg-secondary-dark flex items-baseline justify-between px-2 py-1">
              <span className="text-base font-bold uppercase tracking-widest text-white">
                {'TMTV:'}
              </span>
              <div className="text-white">{`${tmtvValue} mL`}</div>
            </div>
          ) : null}
          <div className="mt-2 flex justify-center">
            <ActionButtons
              actions={actions}
              t={t}
            />
          </div>
        </div>
      </div>
      <div
        className="absolute bottom-1 left-[50px] flex cursor-pointer items-center justify-center text-blue-400 opacity-50 hover:opacity-80"
        onClick={() => {
          // navigate to a url in a new tab
          window.open('https://github.com/OHIF/Viewers/blob/master/modes/tmtv/README.md', '_blank');
        }}
      >
        <Icon
          width="15px"
          height="15px"
          name={'info'}
          className={'text-primary-active ml-4 mr-3'}
        />
        <span>{'User Guide'}</span>
      </div>
    </>
  );
}

PanelRoiThresholdSegmentation.propTypes = {
  commandsManager: PropTypes.shape({
    runCommand: PropTypes.func.isRequired,
  }),
  servicesManager: PropTypes.shape({
    services: PropTypes.shape({
      segmentationService: PropTypes.shape({
        getSegmentation: PropTypes.func.isRequired,
        getSegmentations: PropTypes.func.isRequired,
        toggleSegmentationVisibility: PropTypes.func.isRequired,
        subscribe: PropTypes.func.isRequired,
        EVENTS: PropTypes.object.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};
