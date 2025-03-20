import React from 'react';

import { SOPClassHandlerId, SOPClassHandlerId3D } from './id';
import { ViewportActionButton } from '@ohif/ui';
import i18n from '@ohif/i18n';

export default function onModeEnter({ servicesManager }) {
  const { displaySetService, toolbarService, customizationService } = servicesManager.services;
  const displaySetCache = displaySetService.getDisplaySetCache();

  const srDisplaySets = [...displaySetCache.values()].filter(
    ds => ds.SOPClassHandlerId === SOPClassHandlerId || ds.SOPClassHandlerId === SOPClassHandlerId3D
  );

  srDisplaySets.forEach(ds => {
    // New mode route, allow SRs to be hydrated again
    ds.isHydrated = false;
  });

  const buttons =
    customizationService.getCustomization('cornerstone-dicom-sr.viewportButtons') ?? [];

  toolbarService.addButtons(buttons);

  // The toolbar used in the viewport's status bar. Modes and extensions can further customize
  // it to optionally add other buttons.
  toolbarService.createButtonSection(
    'loadSRMeasurements',
    buttons.map(button => button.id)
  );
}
