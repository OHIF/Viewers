import React from 'react';

import { MeasurementTable } from '@ohif/ui';

import './MeasurementComparisonTable.css';

const overallWarnings = {
  warningList: [
    'All measurements should have a location',
    'Nodal lesions must be >= 15mm short axis AND >= double the acquisition slice thickness by CT and MR',
  ],
};

const measurements = [
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

const additionalFindings = [
  {
    measurementId: '122',
    measurementNumber: '122',
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
    measurementId: '121',
    measurementNumber: '121',
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
    measurementId: '120',
    measurementNumber: '120',
    itemNumber: 3,
    label: '(No description)',
    data: [{ displayText: '2.9 x 9.2' }],
  },
];

const currentCollections = [
  {
    selectorAction: () => {},
    maxMeasurements: 3,
    groupName: 'Measurements',
    measurements: measurements,
  },
  {
    selectorAction: () => {},
    groupName: 'Additional Findings',
    measurements: additionalFindings,
  },
];

const comparisonColletions = [
  {
    selectorAction: () => {},
    maxMeasurements: 3,
    groupName: 'Measurements',
    measurements: measurements,
  },
  {
    selectorAction: () => {},
    groupName: 'Additional Findings',
    measurements: additionalFindings,
  },
];

const comparisonCollections = currentCollections.map((group, index) => {
  return {
    ...group,
    measurements: group.measurements.map((measurement, measurementIndex) => {
      const comparisonCollection = comparisonColletions[index].measurements;
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

const comparisonTimepoints = [
  {
    key: 'Current',
    date: '10-Apr-18',
  },
  {
    key: 'Comparison',
    date: '15-Jun-18',
  },
];

const MeasurementComparisonTable = () => {
  return (
    <div className="MeasurementComparisonTable">
      <MeasurementTable
        timepoints={comparisonTimepoints}
        overallWarnings={overallWarnings}
        measurementCollection={comparisonCollections}
        onRelabelClick={() => {}}
        onEditDescriptionClick={() => {}}
      />
      <div className="generate-report">
        <button className="btn btn-primary">Generate Report</button>
      </div>
    </div>
  );
};

export default MeasurementComparisonTable;
