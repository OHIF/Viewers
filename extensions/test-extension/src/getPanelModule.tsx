import React from 'react';
import {
  PanelMeasurement,
  SeriesMeasurements,
  StudyMeasurements,
} from '@ohif/extension-cornerstone';

export default function getPanelModule({
  commandsManager,
  servicesManager,
  extensionManager,
}: withAppTypes) {
  const childProps = {
    commandsManager,
    servicesManager,
    extensionManager,
  };
  const wrappedPanelMeasurementSeries = () => {
    return (
      <PanelMeasurement {...childProps}>
        <StudyMeasurements>
          <SeriesMeasurements />
        </StudyMeasurements>
      </PanelMeasurement>
    );
  };
  return [
    {
      name: 'panelMeasurementSeries',
      iconName: 'tool-freehand-roi',
      iconLabel: 'Measure Series',
      label: 'Measurement Series',
      component: wrappedPanelMeasurementSeries,
    },
  ];
}
