import React from 'react';

import StudyListTableRow from './StudyListTableRow';

interface StudyListTableProps {
  tableDataSource?: {
    row: unknown[];
    expandedContent: React.ReactNode;
    querying?: boolean;
    onClickRow(...args: unknown[]): unknown;
    isExpanded: boolean;
  }[];
}

const StudyListTable = ({
  tableDataSource,
  querying
}: StudyListTableProps) => {
  return (
    <div className="bg-black">
      <div className="container relative m-auto">
        <table className="w-full text-white">
          <tbody
            data-cy="study-list-results"
            data-querying={querying}
          >
            {tableDataSource.map((tableData, i) => {
              return (
                <StudyListTableRow
                  tableData={tableData}
                  key={i}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudyListTable;
