import React, { useEffect, useState, useCallback, useReducer } from 'react';
import PropTypes from 'prop-types';
import { SegmentationTable, Button, Icon } from '@ohif/ui';
import classnames from 'classnames';

import { useTranslation } from 'react-i18next';

export default function PanelSegmentation({
  servicesManager,
  commandsManager,
}) {
  const { SegmentationService } = servicesManager.services;

  const { t } = useTranslation('PanelSUV');
  const [labelmapLoading, setLabelmapLoading] = useState(false);
  const [selectedSegmentationId, setSelectedSegmentationId] = useState(null);
  const [segmentations, setSegmentations] = useState(() =>
    SegmentationService.getSegmentations()
  );

  /**
   * Update UI based on segmentation changes (added, removed, updated)
   */
  useEffect(() => {
    // ~~ Subscription
    const added = SegmentationService.EVENTS.SEGMENTATION_ADDED;
    const updated = SegmentationService.EVENTS.SEGMENTATION_UPDATED;
    const subscriptions = [];

    [added, updated].forEach(evt => {
      const { unsubscribe } = SegmentationService.subscribe(evt, () => {
        const segmentations = SegmentationService.getSegmentations();
        debugger;
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
    <div className="flex flex-col justify-between h-full">
      <div className="overflow-x-hidden overflow-y-auto invisible-scrollbar">
        {/* show segmentation table */}
        <div className="mt-4">
          {segmentations?.length ? (
            <SegmentationTable
              title={t('Segmentations')}
              amount={segmentations.length}
              segmentations={segmentations}
              activeSegmentationId={selectedSegmentationId}
              onClick={id => {}}
              onToggleVisibility={id => {
                SegmentationService.toggleSegmentationVisibility(id);
              }}
              onToggleVisibilityAll={ids => {
                ids.map(id => {
                  SegmentationService.toggleSegmentationVisibility(id);
                });
              }}
              onDelete={id => {
                SegmentationService.remove(id);
              }}
              onEdit={id => {
                segmentationEditHandler({
                  id,
                  servicesManager,
                });
              }}
            />
          ) : null}
        </div>
      </div>
      <div
        className="opacity-50 hover:opacity-80 flex items-center justify-center text-blue-400 mb-4 cursor-pointer"
        onClick={() => {
          // navigate to a url in a new tab
          window.open(
            'https://github.com/OHIF/Viewers/blob/feat/segmentation-service/modes/tmtv/README.md',
            '_blank'
          );
        }}
      >
        <Icon
          width="15px"
          height="15px"
          name={'info'}
          className={'ml-4 mr-3 text-primary-active'}
        />
        <span>{'User Guide'}</span>
      </div>
    </div>
  );
}

PanelSegmentation.propTypes = {
  commandsManager: PropTypes.shape({
    runCommand: PropTypes.func.isRequired,
  }),
  servicesManager: PropTypes.shape({
    services: PropTypes.shape({
      SegmentationService: PropTypes.shape({
        getSegmentation: PropTypes.func.isRequired,
        getSegmentations: PropTypes.func.isRequired,
        toggleSegmentationVisibility: PropTypes.func.isRequired,
        subscribe: PropTypes.func.isRequired,
        EVENTS: PropTypes.object.isRequired,
        VALUE_TYPES: PropTypes.object.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};
