import React, { useState } from 'react';

import { MeasurementTable, RoundedButtonGroup, Icon } from '@ohif/ui';
import CircularProgressIcon from './CircularProgressIcon';

import './MeasurementComparisonTable.css';

const overallWarnings = {
  warningList: [
    'All measurements should have a location',
    'Nodal lesions must be >= 15mm short axis AND >= double the acquisition slice thickness by CT and MR',
  ],
};

const targetMeasurements = [
  {
    measurementId: '125',
    measurementNumber: '125',
    itemNumber: 1,
    label: '(No description)',
    data: [{ displayText: '12.5 x 4.6' }],
  },
  {
    measurementId: '124',
    measurementNumber: '124',
    itemNumber: 2,
    label: '(No description)',
    data: [{ displayText: '32.5 x 1.6' }],
  },
  {
    measurementId: '123',
    measurementNumber: '123',
    itemNumber: 3,
    hasWarnings: true,
    warningList: [
      'All measurements should have a location',
      'Nodal lesions must be >= 15mm short axis AND >= double the acquisition slice thickness by CT and MR',
    ],
    label: '(No description)',
    data: [{ displayText: '5.5 x 9.2' }],
  },
];

const nonTargetMeasurements = [
  {
    measurementId: '125',
    measurementNumber: '125',
    itemNumber: 1,
    hasWarnings: true,
    warningList: [
      'All measurements should have a location',
      'Nodal lesions must be >= 15mm short axis AND >= double the acquisition slice thickness by CT and MR',
    ],
    label: '(No description)',
    data: [{ displayText: '23.5 x 9.2' }],
  },
  {
    measurementId: '124',
    measurementNumber: '124',
    itemNumber: 2,
    hasWarnings: true,
    warningList: [
      'All measurements should have a location',
      'Nodal lesions must be >= 15mm short axis AND >= double the acquisition slice thickness by CT and MR',
    ],
    label: '(No description)',
    data: [{ displayText: '11.2 x 9.2' }],
  },
  {
    measurementId: '123',
    measurementNumber: '123',
    itemNumber: 3,
    label: '(No description)',
    data: [{ displayText: '2.9 x 9.2' }],
  },
];

const baselineCollections = [
  {
    selectorAction: () => { },
    maxMeasurements: 3,
    groupName: 'Targets',
    measurements: targetMeasurements,
  },
  {
    selectorAction: () => { },
    groupName: 'Non-Targets',
    measurements: nonTargetMeasurements,
  },
];

const followupCollections = [
  {
    selectorAction: () => { },
    maxMeasurements: 3,
    groupName: 'Targets',
    measurements: targetMeasurements,
  },
  {
    selectorAction: () => { },
    groupName: 'Non-Targets',
    measurements: nonTargetMeasurements,
  },
];

const comparisonCollections = baselineCollections.map((group, index) => {
  return {
    ...group,
    measurements: group.measurements.map((measurement, measurementIndex) => {
      const comparisonCollection = followupCollections[index].measurements;
      if (measurementIndex < comparisonCollection.length) {
        return {
          ...measurement,
          data: [
            ...measurement.data,
            ...comparisonCollection[measurementIndex].data,
          ],
        };
      }
    }),
  };
});

const baselineTimepoint = [
  {
    key: 'Baseline',
    date: '10-Apr-18',
  },
];

const comparisonTimepoints = [
  {
    key: 'Follow-up',
    date: '15-Jun-18',
  },
  {
    key: 'Baseline',
    date: '10-Apr-18',
  },
];

const buttons = [
  { value: 'comparison', label: 'Comparison' },
  { value: 'key-timepoints', label: 'Key Timepoints' },
];

const MeasurementComparisonTable = () => {
  const [selectedRightSidePanel, setSelectedRightSidePanel] = useState('comparison');

  const isComparison = selectedRightSidePanel === 'comparison';

  const CustomHeader = ({ t, ...measureGroup }) => {
    return (
      <React.Fragment>
        {measureGroup.selectorAction && (
          <div
            className="tableListHeaderSelector"
            onClick={measureGroup.selectorAction}
          >
            <Icon name="plus" />
          </div>
        )}
        <div className="tableListHeaderTitle">{t(measureGroup.groupName)}</div>
        {measureGroup.maxMeasurements && (
          <div className="maxMeasurements">
            {t('MAX')} {measureGroup.maxMeasurements}
          </div>
        )}
        <div className="numberOfItems">{measureGroup.measurements.length}</div>
      </React.Fragment>
    );
  };

  const CustomTimepointsHeader = ({ timepoints, t }) => {
    return timepoints.map((timepoint, index) => {
      return (
        <div key={index} className="measurementTableHeaderItem">
          <div className="timepointLabel">{t(timepoint.key)}</div>
          <div className="timepointDate">{timepoint.date}</div>
          {timepoints.length > 1 && index === 0 && <CircularProgressIcon />}
        </div>
      );
    });
  };

  return (
    <div className="MeasurementComparisonTable">
      <RoundedButtonGroup
        options={buttons}
        value={selectedRightSidePanel}
        onValueChanged={value => setSelectedRightSidePanel(value)}
      />
      <MeasurementTable
        customHeader={CustomHeader}
        customTimepointsHeader={CustomTimepointsHeader}
        timepoints={isComparison ? baselineTimepoint : comparisonTimepoints}
        overallWarnings={overallWarnings}
        measurementCollection={isComparison ? baselineCollections : comparisonCollections}
      />
      <div className="generate-report">
        <button className="btn btn-primary">Generate Report</button>
      </div>
    </div>
  );
};

export default MeasurementComparisonTable;
