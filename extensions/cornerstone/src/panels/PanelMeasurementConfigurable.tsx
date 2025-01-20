import React from 'react';
import { useMeasurements } from '../hooks/useMeasurements';
import StudyMeasurements from './StudyMeasurements';

export default function PanelMeasurement(props): React.ReactNode {
  const {
    servicesManager,
    measurementFilter,
    content: Content = StudyMeasurements,
    contentProps,
  } = props;

  const displayMeasurements = useMeasurements(servicesManager, {
    measurementFilter,
  });

  // Need to merge defaults on the content props to ensure they get passed to hcildren
  return (
    <Content
      {...props}
      {...contentProps}
      items={displayMeasurements}
    />
  );
}
