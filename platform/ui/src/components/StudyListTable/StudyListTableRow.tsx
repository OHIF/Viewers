import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import getGridWidthClass from '../../utils/getGridWidthClass';
import { Icons } from '@ohif/ui-next';

const StudyListTableRow = props => {
  const { tableData } = props;
  const {
    row,
    expandedContent,
    onClickRow,
    isExpanded,
    dataCY,
    clickableCY,
    onDeleteStudy,
    onDownloadStudy,
    studyUID,
  } = tableData;
  return (
    <>
      <tr
        className="select-none"
        data-cy={dataCY}
      >
        <td
          className={classnames('border-0 p-0', {
            'border-secondary-light bg-primary-dark border-b': isExpanded,
          })}
        >
          <div
            className={classnames(
              'w-full transition duration-300',
              {
                'border-primary-light hover:border-secondary-light mb-2 overflow-visible rounded border':
                  isExpanded,
              },
              {
                'border-transparent': !isExpanded,
              }
            )}
          >
            <table className={classnames('w-full p-4')}>
              <tbody>
                <tr
                  className={classnames(
                    'hover:bg-secondary-main cursor-pointer transition duration-300',
                    {
                      'bg-primary-dark': !isExpanded,
                    },
                    { 'bg-secondary-dark': isExpanded }
                  )}
                  onClick={onClickRow}
                  data-cy={clickableCY}
                >
                  <td className="w-8 px-2 py-2">
                    <button
                      type="button"
                      title="Delete study"
                      onClick={e => {
                        e.stopPropagation();
                        onDeleteStudy?.(studyUID);
                      }}
                      data-cy={`delete-${studyUID}`}
                    >
                      <Icons.Trash className="h-5 w-5 text-red-500 hover:text-red-700" />
                    </button>
                  </td>
                  <td className="w-8 px-2 py-2">
                    <button
                      type="button"
                      title="Download study"
                      onClick={e => {
                        e.stopPropagation();
                        onDownloadStudy?.(studyUID);
                      }}
                      data-cy={`download-${studyUID}`}
                    >
                      <Icons.Download className="text-primary-light hover:text-primary-active h-5 w-5" />
                    </button>
                  </td>
                  {row.map((cell, index) => {
                    const { content, title, gridCol } = cell;
                    return (
                      <td
                        key={index}
                        className={classnames(
                          'truncate px-4 py-2 text-base',
                          { 'border-secondary-light border-b': !isExpanded },
                          getGridWidthClass(gridCol) || ''
                        )}
                        style={{
                          maxWidth: 0,
                        }}
                        title={title}
                      >
                        <div className="flex">
                          {index === 0 && (
                            <div>
                              {isExpanded ? (
                                <Icons.ChevronOpen className="-mt-1 mr-4 inline-flex" />
                              ) : (
                                <Icons.ChevronClosed className="-mt-1 mr-4 inline-flex rotate-180" />
                              )}
                            </div>
                          )}
                          <div
                            className={classnames({ 'overflow-hidden': true }, { truncate: true })}
                          >
                            {content}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
                {isExpanded && (
                  <tr className="max-h-0 w-full select-text overflow-hidden bg-black">
                    <td colSpan={row.length + 2}>{expandedContent}</td>
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
    dataCY: PropTypes.string,
    clickableCY: PropTypes.string,
    onDeleteStudy: PropTypes.func.isRequired,
    onDownloadStudy: PropTypes.func.isRequired,
    studyUID: PropTypes.string.isRequired,
  }),
};

export default StudyListTableRow;
