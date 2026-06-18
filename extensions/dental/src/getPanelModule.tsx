import React from 'react';
import { Types } from '@ohif/core';

import DentalMeasurementsPanel from './measurements/DentalMeasurementsPanel';

function getPanelModule({ servicesManager }): Types.Panel[] {
  return [
    {
      name: 'dentalMeasurements',
      iconName: 'tab-linear',
      iconLabel: 'Dental measurements',
      label: 'Dental Measurements',
      component: () => <DentalMeasurementsPanel servicesManager={servicesManager} />,
    },
  ];
}

export default getPanelModule;
