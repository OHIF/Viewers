import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Icon } from '../';

const StudyListTableRow = props => {
  const { tableData } = props;
  const { row, expandedContent, onClickRow, isExpanded } = tableData;
  return (
    <>
      <tr className="select-none">
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
                  {row.map((cell, index) => {
                    const { content, title, gridCol } = cell;

                    return (
                      <td
                        key={index}
                        className={classnames(
                          'px-4 py-2 text-base truncate',
                          { 'border-b border-secondary-light': !isExpanded },
                          `w-${gridCol}/24` || ''
                        )}
                        style={{
                          maxWidth: 0,
                        }}
                        title={title}
                      >
                        {index === 0 && (
                          <Icon
                            name={isExpanded ? 'chevron-down' : 'chevron-right'}
                            className="mr-4 inline-flex"
                          />
                        )}
                        {content}
                      </td>
                    );
                  })}
                </tr>
                {isExpanded && (
                  <tr className="w-full bg-black select-text max-h-0 overflow-hidden">
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
    /** A table row represented by an array of "cell" objects */
    row: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string.isRequired,
        /** Optional content to render in row's cell */
        content: PropTypes.node,
        /** Title attribute to use for provided content */
        title: PropTypes.string,
        gridCol: PropTypes.number.isRequired,
      })
    ).isRequired,
    expandedContent: PropTypes.node.isRequired,
    onClickRow: PropTypes.func.isRequired,
    isExpanded: PropTypes.bool.isRequired,
  }),
};

export default StudyListTableRow;
