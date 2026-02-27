import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import getGridWidthClass from '../../utils/getGridWidthClass';
import { Icons } from '@ohif/ui-next';

const StudyListTableRow = props => {
  const { tableData, useLightTheme = false, colCount } = props;
  const { row, expandedContent, onClickRow, isExpanded, dataCY, clickableCY } = tableData;

  if (useLightTheme) {
    return (
      <>
        <tr
          className={classnames(
            'cursor-pointer select-none border-b border-[#f3f4f6] text-[13px] transition-colors',
            isExpanded ? 'bg-[#f3f4f6]' : 'hover:bg-[#f9fafb]'
          )}
          data-cy={dataCY}
          onClick={onClickRow}
        >
          <td className="w-8 px-2 py-2 text-[#9ca3af]">
            {isExpanded ? (
              <Icons.ChevronOpen className="inline-flex h-3.5 w-3.5" />
            ) : (
              <Icons.ChevronClosed className="inline-flex h-3.5 w-3.5 rotate-180" />
            )}
          </td>
          {row.map((cell, index) => (
            <td
              key={cell.key || index}
              className="truncate px-3 py-2"
              title={cell.title}
            >
              {cell.content}
            </td>
          ))}
        </tr>
        {isExpanded && (
          <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
            <td colSpan={colCount || row.length + 1} className="p-4">
              {expandedContent}
            </td>
          </tr>
        )}
      </>
    );
  }

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
  useLightTheme: PropTypes.bool,
  colCount: PropTypes.number,
  tableData: PropTypes.shape({
    row: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string.isRequired,
        content: PropTypes.node,
        title: PropTypes.string,
        gridCol: PropTypes.number,
      })
    ).isRequired,
    expandedContent: PropTypes.node.isRequired,
    onClickRow: PropTypes.func.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    dataCY: PropTypes.string,
    clickableCY: PropTypes.string,
  }),
};

export default StudyListTableRow;
