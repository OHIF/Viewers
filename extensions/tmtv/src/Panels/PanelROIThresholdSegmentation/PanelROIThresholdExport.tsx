import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';
import ExportReports from './ExportReports';

export default function PanelRoiThresholdSegmentation({ servicesManager, commandsManager }) {
  const { segmentationService } = servicesManager.services;

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

  const tmtvValue = segmentations?.[0]?.cachedStats?.tmtv?.value || null;
  const config = segmentations?.[0]?.cachedStats?.tmtv?.config || {};

  return (
    <>
      <div className="flex flex-col">
        <div className="invisible-scrollbar overflow-y-auto overflow-x-hidden">
          {tmtvValue !== null ? (
            <div className="bg-secondary-dark mt-1 flex items-baseline justify-between px-2 py-1">
              <span className="text-base font-bold uppercase tracking-widest text-white">
                {'TMTV:'}
              </span>
              <div className="text-white">{`${tmtvValue} mL`}</div>
            </div>
          ) : null}
          <ExportReports
            segmentations={segmentations}
            tmtvValue={tmtvValue}
            config={config}
            commandsManager={commandsManager}
          />
        </div>
      </div>
      <div
        className="absolute bottom-1 flex cursor-pointer items-center justify-center text-blue-400 opacity-50 hover:opacity-80"
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
