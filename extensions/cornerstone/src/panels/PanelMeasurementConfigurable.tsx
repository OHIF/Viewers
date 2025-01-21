import React from 'react';
import { useMeasurements } from '../hooks/useMeasurements';
import StudyMeasurements from './StudyMeasurements';

export default function PanelMeasurement(props): React.ReactNode {
  const {
    servicesManager,
    measurementFilter,
    component: Component = StudyMeasurements,
    componentProps,
    commandsManager,
    key = 'PanelMeasurementConfigurable',
    configuration,
  } = props;

  console.log('Panel measurement configurable configuration=', configuration);

  const displayMeasurements = useMeasurements(servicesManager, {
    measurementFilter,
  });
  const childProps = {
    servicesManager,
    measurementFilter,
    commandsManager,
  };

  // Need to merge defaults on the content props to ensure they get passed to hcildren
  return (
    <Component
      key={key}
      {...childProps}
      {...componentProps}
      childProps={childProps}
      items={displayMeasurements}
    />
  );
}
