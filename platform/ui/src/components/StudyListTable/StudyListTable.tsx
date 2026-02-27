import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import StudyListTableRow from './StudyListTableRow';

const StudyListTable = ({
  tableDataSource,
  querying,
  sectionTitle,
  sectionCount,
  headerColumns,
  useLightTheme = false,
}) => {
  if (useLightTheme) {
    return (
      <div className="rounded-lg bg-white px-5 py-4 shadow-sm">
        {sectionTitle != null && (
          <h2
            className="mb-3 text-[15px] font-semibold text-[#111827]"
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            {sectionTitle}
            {sectionCount != null && (
              <span className="ml-1.5 font-normal text-[#6b7280]">({sectionCount})</span>
            )}
          </h2>
        )}
        <table className="w-full border-collapse text-[13px] text-[#374151]" style={{ fontFamily: 'Roboto, sans-serif', tableLayout: 'fixed' }}>
          {headerColumns && headerColumns.length > 0 && (
            <thead>
              <tr className="border-b border-[#e5e7eb]">
                <th className="w-8 px-2 py-2" />
                {headerColumns.map((col, idx) => (
                  <th
                    key={idx}
                    className="truncate px-3 py-2 text-left text-[12px] font-medium text-[#6b7280]"
                    style={col.width ? { width: col.width } : {}}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {col.sortable !== false && (
                        <svg width="8" height="8" viewBox="0 0 10 10" className="shrink-0 text-[#9ca3af]">
                          <path d="M5 7L1 3h8L5 7z" fill="currentColor" />
                        </svg>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody data-cy="study-list-results" data-querying={querying}>
            {tableDataSource.map((tableData, i) => (
              <StudyListTableRow
                tableData={tableData}
                key={tableData.dataCY || i}
                useLightTheme
                colCount={headerColumns ? headerColumns.length + 1 : undefined}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="bg-black">
      <div className="container relative m-auto">
        <table className="w-full text-white">
          <tbody
            data-cy="study-list-results"
            data-querying={querying}
          >
            {tableDataSource.map((tableData, i) => (
              <StudyListTableRow
                tableData={tableData}
                key={tableData.dataCY || i}
              />
            ))}
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
      dataCY: PropTypes.string,
    })
  ),
  querying: PropTypes.bool,
  sectionTitle: PropTypes.string,
  sectionCount: PropTypes.number,
  headerColumns: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      width: PropTypes.string,
      sortable: PropTypes.bool,
    })
  ),
  useLightTheme: PropTypes.bool,
};

export default StudyListTable;
