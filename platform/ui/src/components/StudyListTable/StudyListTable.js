import React from 'react';
import PropTypes from 'prop-types';

import StudyListTableRow from './StudyListTableRow';

const StudyListTable = ({ tableDataSource }) => {
  return (
    <div className="bg-black">
      <div className="container m-auto relative">
        <table className="w-full text-white">
          <tbody data-cy="study-list-results">
            {tableDataSource.map((tableData, i) => {
              return <StudyListTableRow tableData={tableData} key={i} />;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

StudyListTable.propTypes = {
  tableDataSource: PropTypes.arrayOf(
    PropTypes.shape({
      row: PropTypes.array.isRequired,
      expandedContent: PropTypes.node.isRequired,
      onClickRow: PropTypes.func.isRequired,
      isExpanded: PropTypes.bool.isRequired,
    })
  ),
};

export default StudyListTable;
