import React from 'react';
import { PanelMeasurement, SeriesMeasurements } from '@ohif/extension-cornerstone';

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
  const wrappedPanelMeasurementSeries = ({ configuration }) => {
    return (
      <PanelMeasurement
        {...childProps}
        componentProps={{
          grouping: {
            component: SeriesMeasurements,
          },
        }}
      />
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
