import React from 'react';
import './AITriggerComponent.css';
import LayerControls from './LayerControls/LayerControls';
import JobDetail from './JobParameters/JobDetails';

const AITriggerComponentPanel = () => {
  return (
    <div>
      <LayerControls />
      <JobDetail />
    </div>
  );
};

export default AITriggerComponentPanel;
