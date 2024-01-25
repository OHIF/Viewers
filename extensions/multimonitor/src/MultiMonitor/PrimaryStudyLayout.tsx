import React, { useState, useEffect, } from 'react';
import { utils } from '@ohif/core';

const { formatPN } = utils;

export default function MultiMonitorLayout(props) {
  const [studyData, setStudyData] = useState(null);

  const { servicesManager, commandsManager } = props;
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

  return (<div style={{ background: 'white', color: 'green', width: '100%' }}>

    <p><b>Patient</b> {formatPN(studyData?.PatientName)}</p>
  </div>);
}
