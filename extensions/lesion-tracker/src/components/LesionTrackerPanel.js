import React, { useState } from 'react';

import { MeasurementTable, RoundedButtonGroup } from '@ohif/ui';

import './LesionTrackerPanel.css';

const measurementCollection = [
  {
    selectorAction: () => { },
    maxMeasurements: 3,
    groupName: 'Targets',
    measurements: [
      {
        measurementId: '125',
        measurementNumber: '125',
        itemNumber: 1,
        label: 'Chest Wall Single Site',
        data: [{ displayText: 'MD' }],
      },
    ],
  },
  {
    selectorAction: () => { },
    groupName: 'Non-Targets',
    measurements: [
      {
        measurementId: '125',
        measurementNumber: '125',
        itemNumber: 1,
        label: 'Chest Wall Single Site',
        data: [{ displayText: 'MD' }],
      },
    ],
  },
];

const measurementCollection2 = [
  {
    selectorAction: () => { },
    maxMeasurements: 3,
    groupName: 'Targets',
    measurements: [
      {
        measurementId: '125',
        measurementNumber: '125',
        itemNumber: 1,
        label: 'Chest Wall Single Site',
        data: [{ displayText: 'MD' }, { displayText: 'NM' }],
      },
    ],
  },
  {
    selectorAction: () => { },
    groupName: 'Non-Targets',
    measurements: [
      {
        measurementId: '125',
        measurementNumber: '125',
        itemNumber: 1,
        label: 'Chest Wall Single Site',
        data: [{ displayText: 'MD' }, { displayText: 'NM' }],
      },
    ],
  },
];

const timepoints = [
  {
    label: 'Follow-up',
    date: '15-Jun-18',
  },
  {
    label: 'Baseline',
    date: '10-Apr-18',
  },
];

const buttons = [
  { value: 'comparison', label: 'Comparison' },
  { value: 'key-timepoints', label: 'Key Timepoints' },
];

const LesionTrackerPanel = () => {
  const [selectedRightSidePanel, setSelectedRightSidePanel] = useState('comparison');

  return (
    <div className="LesionTrackerPanel">
      <RoundedButtonGroup
        options={buttons}
        value={selectedRightSidePanel}
        onValueChanged={value => setSelectedRightSidePanel(value)}
      />
      <MeasurementTable
        timepoints={timepoints}
        measurementCollection={selectedRightSidePanel === 'comparison' ? measurementCollection : measurementCollection2}
      />
      <div className="generate-report">
        <button className="btn btn-primary">Generate Report</button>
      </div>
    </div>
  );
};

export default LesionTrackerPanel;
