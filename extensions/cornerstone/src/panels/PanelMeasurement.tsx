import React from 'react';
import { useMeasurements } from '../hooks/useMeasurements';
import StudyMeasurements from '../components/StudyMeasurements';

export default function PanelMeasurement(props): React.ReactNode {
  const {
    servicesManager,
    measurementFilter,
    component: Component = StudyMeasurements,
    componentProps,
    commandsManager,
    emptyComponent: EmptyComponent,
    key = 'PanelMeasurement',
  } = props;

  const displayMeasurements = useMeasurements(servicesManager, {
    measurementFilter,
  });

  const childProps = {
    servicesManager,
    measurementFilter,
    commandsManager,
  };

  if (!displayMeasurements.length) {
    return EmptyComponent ? (
      <EmptyComponent />
    ) : (
      <span className="text-white">No Measurements</span>
    );
  }

  // Need to merge defaults on the content props to ensure they get passed to children
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
