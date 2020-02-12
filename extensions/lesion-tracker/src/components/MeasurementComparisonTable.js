import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { MeasurementTable } from '@ohif/ui';

import './MeasurementComparisonTable.css';

const warningsMock = [
  'All measurements should have a location',
  'Nodal lesions must be >= 15mm short axis AND >= double the acquisition slice thickness by CT and MR',
];

const overallWarningsMock = {
  warningList: warningsMock,
};

const additionalFindingsMock = [
  {
    measurementId: '122',
    measurementNumber: '122',
    itemNumber: 1,
    hasWarnings: true,
    warningList: warningsMock,
    label: 'Mock (No description)',
    data: [{ displayText: '23.5 x 9.2' }],
  },
  {
    measurementId: '121',
    measurementNumber: '121',
    itemNumber: 2,
    hasWarnings: true,
    warningList: warningsMock,
    label: 'Mock (No description)',
    data: [{ displayText: '11.2 x 9.2' }],
  },
  {
    measurementId: '120',
    measurementNumber: '120',
    itemNumber: 3,
    label: 'Mock (No description)',
    data: [{ displayText: '2.9 x 9.2' }],
  },
];

const comparisonTimepointsMock = [
  {
    key: 'Current',
    date: '10-Apr-18',
  },
  {
    key: 'Comparison',
    date: '15-Jun-18',
  },
];

const _toTableFormat = measurements => {
  return measurements.map(({ id }, index) => {
    return {
      measurementId: id,
      measurementNumber: id,
      itemNumber: index,
      label: '(No description)',
      data: [{ displayText: index + 1 }],
    };
  });
};

const MeasurementComparisonTable = props => {
  /* Measurement Groups */
  const [currentMeasurementGroups, setCurrentMeasurementGroups] = useState([]);
  const [comparisonMeasurementGroups, setComparisonMeasurementGroups] = useState([]);
  const [mergedMeasurementGroups, setMergedMeasurementGroups] = useState([]);

  useEffect(() => {
    setCurrentMeasurementGroups([
      {
        maxMeasurements: 3,
        groupName: 'Measurements',
        measurements: _toTableFormat(props.measurements),
      },
      {
        groupName: 'Additional Findings',
        measurements: additionalFindingsMock,
      },
    ]);
    setComparisonMeasurementGroups([
      {
        maxMeasurements: 3,
        groupName: 'Measurements',
        measurements: _toTableFormat(props.measurements),
      },
      {
        groupName: 'Additional Findings',
        measurements: additionalFindingsMock,
      },
    ]);
  }, [props.measurements, props.additionalFindings]);

  useEffect(() => {
    setMergedMeasurementGroups(
      currentMeasurementGroups.map((group, index) => {
        return {
          ...group,
          measurements: group.measurements.map(
            (measurement, measurementIndex) => {
              if (!comparisonMeasurementGroups[index]) return measurement;
              const comparisonCollection = comparisonMeasurementGroups[index].measurements;
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
  }, [currentMeasurementGroups, comparisonMeasurementGroups]);

  return (
    <div className="MeasurementComparisonTable">
      <MeasurementTable
        timepoints={comparisonTimepointsMock}
        overallWarnings={overallWarningsMock}
        measurementCollection={mergedMeasurementGroups}
        onRelabelClick={props.onItemRelabelClick}
        onEditDescriptionClick={props.onItemEditDescriptionClick}
        onItemClick={props.onItemClick}
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
  onItemClick: PropTypes.func,
  onItemRelabelClick: PropTypes.func,
  onItemEditDescriptionClick: PropTypes.func,
};

MeasurementComparisonTable.defaultProps = {
  measurements: [],
  additionalFindings: [],
  onItemClick: () => { },
  onItemRelabelClick: () => { },
  onItemEditDescriptionClick: () => { },
};

export default MeasurementComparisonTable;
