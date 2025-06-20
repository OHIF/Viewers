import React from 'react';

import { useMeasurements } from '../hooks/useMeasurements';
import XNATStudyMeasurements from '../Components/XNATStudyMeasurements';

export default function XNATPanelMeasurement(props): React.ReactNode {
  const { measurementFilter, emptyComponent: EmptyComponent, children } = props;

  const displayMeasurements = useMeasurements({ measurementFilter });

  if (!displayMeasurements.length) {
    return EmptyComponent ? (
      <EmptyComponent items={displayMeasurements} />
    ) : (
      <span className="text-white">No Measurements</span>
    );
  }

  if (children) {
    const cloned = React.Children.map(children, child =>
      React.cloneElement(child, {
        items: displayMeasurements,
        filter: measurementFilter,
      })
    );
    return cloned;
  }
  return <XNATStudyMeasurements items={displayMeasurements} />;
} 