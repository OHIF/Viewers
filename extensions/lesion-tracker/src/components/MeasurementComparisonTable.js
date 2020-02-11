import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

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

const comparisonTimepoints = [
  {
    key: 'Current',
    date: '10-Apr-18',
  },
  {
    key: 'Comparison',
    date: '15-Jun-18',
  }
];

const MeasurementComparisonTable = props => {
  const [measurements, setMeasurements] = useState(props.measurements || []);
  const [additionalFindings, setAdditionalFindings] = useState(props.additionalFindings || []);

  const [comparisonGroups, setComparisonGroups] = useState([]);
  const [currentGroups, setCurrentGroups] = useState([]);

  /* const refreshComparisonGroups = () => {
    setComparisonGroups(
      currentGroups.map((group, index) => {
        return {
          ...group,
          measurements: group.measurements.map(
            (measurement, measurementIndex) => {
              const comparisonCollection = comparisonGroups[index].measurements;
              if (measurementIndex < comparisonCollection.length) {
                return {
                  ...measurement,
                  data: [
                    ...measurement.data,
                    ...comparisonCollection[measurementIndex].data,
                  ],
                };
              }
            }
          ),
        };
      })
    );
  }; */

  const convertMeasurementsToTableData = measurements => {
    return measurements.map(({ id, label }, index) => {
      return {
        measurementId: id,
        measurementNumber: id,
        itemNumber: index,
        label: '(No description)',
        data: [{ displayText: label || id }],
      };
    });
  };

  useEffect(() => {
    setMeasurements(convertMeasurementsToTableData(props.measurements));
  }, [props.measurements]);

  useEffect(() => {
    setCurrentGroups([
      {
        selectorAction: () => { },
        maxMeasurements: 3,
        groupName: 'Measurements',
        measurements: measurements,
      },
      {
        selectorAction: () => { },
        groupName: 'Additional Findings',
        measurements: additionalFindings,
      },
    ]);

    setComparisonGroups([
      {
        selectorAction: () => { },
        maxMeasurements: 3,
        groupName: 'Measurements',
        measurements: measurements,
      },
      {
        selectorAction: () => { },
        groupName: 'Additional Findings',
        measurements: additionalFindings,
      },
    ]);
  }, [measurements, additionalFindings]);

  return (
    <div className="MeasurementComparisonTable">
      <MeasurementTable
        timepoints={comparisonTimepoints}
        overallWarnings={overallWarnings}
        measurementCollection={comparisonGroups}
        onRelabelClick={() => { }}
        onEditDescriptionClick={() => { }}
      />
      <div className="generate-report">
        <button className="btn btn-primary">Generate Report</button>
      </div>
    </div>
  );
};

MeasurementComparisonTable.propTypes = {
  measurements: PropTypes.array,
  additionalFindings: PropTypes.array,
};

export default MeasurementComparisonTable;
