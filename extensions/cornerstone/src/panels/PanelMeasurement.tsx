import React from 'react';
import { useSystem } from '@ohif/core';

import { useMeasurements } from '../hooks/useMeasurements';
import StudyMeasurements from '../components/StudyMeasurements';

export default function PanelMeasurement(props): React.ReactNode {
  const {
    measurementFilter,
    component: Component = StudyMeasurements,
    componentProps,
    emptyComponent: EmptyComponent,
    key = 'PanelMeasurement',
    children,
  } = props;

  const childProps = useSystem();
  const displayMeasurements = useMeasurements(childProps.servicesManager, {
    measurementFilter,
  });

  if (!displayMeasurements.length) {
    return EmptyComponent ? (
      <EmptyComponent
        key={key}
        {...childProps}
        {...componentProps}
        childProps={childProps}
        items={displayMeasurements}
      />
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
