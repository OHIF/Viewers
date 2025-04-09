import React from 'react';
import { PanelSegmentation } from '@ohif/extension-cornerstone';
import PanelROIThresholdExport from './PanelROIThresholdSegmentation/PanelROIThresholdExport';

export default function PanelTMTV({ configuration }: withAppTypes) {
  return (
    <>
      <PanelSegmentation configuration={configuration}>
        <PanelROIThresholdExport />
      </PanelSegmentation>
    </>
  );
}
