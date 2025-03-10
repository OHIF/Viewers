import React from 'react';
import { StudySummaryFromMetadata } from './StudySummaryFromMetadata';
import StudyMeasurementsActions from './StudyMeasurementsActions';

export function StudySummaryWithActions(props) {
  return (
    <div>
      <StudySummaryFromMetadata {...props} />
      <StudyMeasurementsActions {...props} />
    </div>
  );
}

export default StudySummaryWithActions;
