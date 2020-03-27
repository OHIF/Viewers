import React from 'react';
import PropTypes from 'prop-types';

import { EmptyStudies } from '@ohif/ui';

import StudyListTableRow from './StudyListTableRow';

const StudyListTable = ({
  studies,
  numOfStudies,
  filtersMeta,
  tableDataSource,
}) => {
  const renderTable = () => {
    return (
      <table className="w-full text-white">
        <tbody>
          {tableDataSource.map((study, i) => {
            return (
              <StudyListTableRow
                study={study}
                key={i}
                AccessionNumber={study.AccessionNumber || ''}
                Modalities={study.Modalities || ''}
                Instances={study.Instances || ''}
                StudyDescription={study.StudyDescription || ''}
                PatientId={study.PatientId || ''}
                PatientName={study.PatientName || ''}
                StudyDate={study.StudyDate || ''}
                series={study.series || []}
                filtersMeta={filtersMeta}
              />
            );
          })}
        </tbody>
      </table>
    );
  };

  const renderEmpty = () => {
    return (
      <div className="flex flex-col items-center justify-center pt-48">
        <EmptyStudies />
      </div>
    );
  };

  return (
    <>
      <div className="bg-black">
        <div className="container m-auto relative">
          {numOfStudies > 0 ? renderTable() : renderEmpty()}
        </div>
      </div>
    </>
  );
};

StudyListTable.propTypes = {
  studies: PropTypes.arrayOf(
    PropTypes.shape({
      AccessionNumber: PropTypes.string.isRequired,
      Modalities: PropTypes.string.isRequired,
      Instances: PropTypes.number.isRequired,
      PatientId: PropTypes.string.isRequired,
      PatientName: PropTypes.string.isRequired,
      StudyDescription: PropTypes.string.isRequired,
      StudyDate: PropTypes.string.isRequired,
      series: PropTypes.array.isRequired,
    })
  ).isRequired,
  numOfStudies: PropTypes.number.isRequired,
};

export default StudyListTable;
