import React from 'react';
import PropTypes from 'prop-types';

import StudyListTableRow from './StudyListTableRow';

const StudyListTable = ({ filtersMeta, tableDataSource }) => {
  return (
    <>
      <div className="bg-black">
        <div className="container m-auto relative">
          <table className="w-full text-white">
            <tbody>
              {tableDataSource.map((tableData, i) => {
                return (
                  <StudyListTableRow
                    tableData={tableData}
                    key={i}
                    filtersMeta={filtersMeta}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

StudyListTable.propTypes = {
  tableDataSource: PropTypes.arrayOf(
    PropTypes.shape({
      row: PropTypes.object.isRequired,
      expandedContent: PropTypes.node.isRequired,
      onClickRow: PropTypes.func.isRequired,
      isExpanded: PropTypes.bool.isRequired,
    })
  ),
  filtersMeta: PropTypes.arrayOf(PropTypes.object),
};

export default StudyListTable;
