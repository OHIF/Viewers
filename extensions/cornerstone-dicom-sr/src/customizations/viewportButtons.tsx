import { ViewportActionButton } from '@ohif/ui-next';
import i18n from '@ohif/i18n';
import React from 'react';

export default {
  'cornerstone-dicom-sr.viewportButtons': [
    {
      // A base/default button for loading measurements. It is added to the toolbar below.
      // Customizations to this button can be made in the mode or by another extension.
      // For example, the button label can be changed and/or the command to clear
      // the measurements can be dropped.
      id: 'loadSRMeasurements',
      component: props => (
        <ViewportActionButton {...props}>{i18n.t('Common:LOAD')}</ViewportActionButton>
      ),
      props: {
        commands: ['clearMeasurements', 'loadSRMeasurements'],
      },
    },
  ],
};
