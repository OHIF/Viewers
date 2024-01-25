import React, { useState, useEffect } from 'react';

import MultiMonitorHeader from './MultiMonitorHeader';
import PrimaryStudyLayout from './PrimaryStudyLayout';
import PriorsList from './PriorsList';

export default function MultiMonitorLayout(props) {
  const [studyData, setStudyData] = useState(null);

  const { servicesManager } = props;
  const { displaySetService } = servicesManager.services;

  useEffect(() => {
    // DISPLAY_SETS_ADDED returns an array of DisplaySets that were added
    const unsubscribe = displaySetService.subscribe(
      displaySetService.EVENTS.DISPLAY_SETS_ADDED,
      data => {
        const { instance: studyInstance } = data.displaySetsAdded[0];
        const { StudyInstanceUID } = studyInstance;
        console.log("Displaying study UID", StudyInstanceUID);
        setStudyData(studyInstance);

      });
    return unsubscribe;
  });

  return (<div>
    <MultiMonitorHeader {...props} studyData={studyData} />
    <PrimaryStudyLayout {...props} studyData={studyData} />
    <PriorsList {...props} studyData={studyData} />
  </div>);
}
