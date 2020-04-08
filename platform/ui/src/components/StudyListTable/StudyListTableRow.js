import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const StudyListTableRow = (props) => {
  const { tableData } = props;
  const { row, expandedContent, onClickRow, isExpanded } = tableData;
  return (
    <>
      <tr>
        <td
          className={classnames('border-0 p-0', {
            'border-b border-secondary-light bg-primary-dark': isExpanded,
          })}
        >
          <div
            className={classnames(
              'w-full transition border-transparent duration-300',
              {
                'border border-primary-light rounded overflow-hidden mb-2 hover:border-secondary-light': isExpanded,
              }
            )}
          >
            <table className={classnames('w-full p-4')}>
              <tbody>
                <tr
                  className={classnames(
                    'cursor-pointer hover:bg-secondary-main transition duration-300 bg-black',
                    {
                      'bg-primary-dark': !isExpanded,
                    },
                    { 'bg-secondary-dark': isExpanded }
                  )}
                  onClick={onClickRow}
                >
                  {row.map((cell) => {
                    const { content, gridCol, name } = cell;

                    return (
                      <td
                        key={name}
                        className={classnames(
                          'px-4 py-2 text-base',
                          { 'border-b border-secondary-light': !isExpanded },
                          `w-${gridCol}/24` || ''
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
                    className={classnames(
                      'w-full bg-black max-h-0 overflow-hidden'
                    )}
                  >
                    <td colSpan={row.length}>{expandedContent}</td>
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
    row: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string.isRequired,
        content: PropTypes.node.isRequired,
        gridCol: PropTypes.number.isRequired,
      })
    ).isRequired,
    expandedContent: PropTypes.node.isRequired,
    onClickRow: PropTypes.func.isRequired,
    isExpanded: PropTypes.bool.isRequired,
  }),
};

export default StudyListTableRow;
