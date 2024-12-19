import React from 'react';

import { SOPClassHandlerId, SOPClassHandlerId3D } from './id';
import { ViewportActionButton } from '@ohif/ui';
import i18n from '@ohif/i18n';

export default function onModeEnter({ servicesManager }) {
  const { displaySetService, toolbarService } = servicesManager.services;
  const displaySetCache = displaySetService.getDisplaySetCache();

  const srDisplaySets = [...displaySetCache.values()].filter(
    ds => ds.SOPClassHandlerId === SOPClassHandlerId || ds.SOPClassHandlerId === SOPClassHandlerId3D
  );

  srDisplaySets.forEach(ds => {
    // New mode route, allow SRs to be hydrated again
    ds.isHydrated = false;
  });

  toolbarService.addButtons([
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
  ]);

  // The toolbar used in the viewport's status bar. Modes and extensions can further customize
  // it to optionally add other buttons.
  toolbarService.createButtonSection('loadSRMeasurements', ['loadSRMeasurements']);
}
