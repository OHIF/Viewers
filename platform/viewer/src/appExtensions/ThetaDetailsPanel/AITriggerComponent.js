import React from 'react';
import './AITriggerComponent.css';
import LayerControls from './LayerControls/LayerControls';
import JobDetail from './JobParameters/JobDetails';
import TextureFeature from './TextureFeatures/TextureFeature';

const AITriggerComponentPanel = () => {
  return (
    <div>
      <LayerControls />
      <JobDetail />
      <TextureFeature />
    </div>
  );
};

export default AITriggerComponentPanel;
