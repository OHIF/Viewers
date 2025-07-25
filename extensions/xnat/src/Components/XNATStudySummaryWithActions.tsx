import React from 'react';
import { StudySummaryFromMetadata } from './StudySummaryFromMetadata';
import XNATStudyMeasurementsActions from './XNATStudyMeasurementsActions';

export function XNATStudySummaryWithActions(props) {
  return (
    <div>
      <StudySummaryFromMetadata {...props} />
      <XNATStudyMeasurementsActions {...props} />
    </div>
  );
}

export default XNATStudySummaryWithActions; 