import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const getGridColClass = (filtersMeta, name) => {
  const filter = filtersMeta.find(filter => filter.name === name);
  return (filter && filter.gridCol && `w-${filter.gridCol}/24`) || '';
};

const StudyListTableRow = props => {
  const { tableData, filtersMeta } = props;
  const { row, expandedContent, onClickRow, isExpanded } = tableData;

  const tdClasses = [
    'px-4 py-2 text-base',
    { 'border-b border-custom-violetPale': !isExpanded },
  ];
  return (
    <>
      <tr>
        <td
          className={classnames('border-0 p-0', {
            'border-b border-custom-violetPale bg-custom-navyDark': isExpanded,
          })}
        >
          <div
            className={classnames('w-full transition duration-300', {
              'border border-custom-aquaBright rounded overflow-hidden mb-2 hover:border-custom-violetPale': isExpanded,
            })}
          >
            <table className={classnames('w-full p-4')}>
              <tbody>
                <tr
                  className={classnames(
                    'cursor-pointer hover:bg-custom-violetDark transition duration-300 bg-black',
                    {
                      'bg-custom-navyDark': !isExpanded,
                    },
                    { 'bg-custom-navy': isExpanded }
                  )}
                  onClick={onClickRow}
                >
                  {Object.keys(row).map(cellKey => {
                    const content = row[cellKey];

                    return (
                      <td
                        key={cellKey}
                        className={classnames(
                          ...tdClasses,
                          getGridColClass(filtersMeta, cellKey)
                        )}
                      >
                        <div className="flex flex-row items-center pl-1">
                          {content}
                        </div>
                      </td>
                    );
                  })}
                </tr>
                {isExpanded && (
                  <tr
                    className={classnames('bg-black max-h-0 overflow-hidden')}
                  >
                    {expandedContent}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </td>
      </tr>
    </>
  );
};

StudyListTableRow.propTypes = {
  tableData: PropTypes.shape({
    row: PropTypes.object.isRequired,
    expandedContent: PropTypes.node.isRequired,
    onClickRow: PropTypes.func.isRequired,
    isExpanded: PropTypes.bool.isRequired,
  }),
  filtersMeta: PropTypes.arrayOf(PropTypes.object),
};

export default StudyListTableRow;
