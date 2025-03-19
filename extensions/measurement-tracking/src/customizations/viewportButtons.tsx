import { ViewportActionButton } from '@ohif/ui-next';
import i18n from '@ohif/i18n';
import React from 'react';

export default {
  'cornerstone-dicom-sr.viewportButtons': {
    buttons: [
      {
        // A button for loading tracked, SR measurements.
        // Note that the command run is registered in TrackedMeasurementsContext
        // because it must be bound to a React context's data.
        id: 'loadSRMeasurements',
        component: props => (
          <ViewportActionButton {...props}>{i18n.t('Common:LOAD')}</ViewportActionButton>
        ),
        props: {
          commands: ['loadTrackedSRMeasurements'],
        },
      },
    ],
  },
};
