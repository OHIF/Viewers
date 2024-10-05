import React, { useState } from 'react'; // Added useState
import PropTypes from 'prop-types';
import classnames from 'classnames';
import axios from 'axios';
import getGridWidthClass from '../../utils/getGridWidthClass';
import apiClient from '../../apis/apiClient';

import Icon from '../Icon';

const StudyListTableRow = props => {
  const { tableData, studyUid } = props;
  const { row, expandedContent, onClickRow, isExpanded, dataCY, clickableCY } = tableData;

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');

  const handleShareClick = e => {
    e.stopPropagation();
    setIsPopupOpen(!isPopupOpen);
    setError('');
  };
  const handleSubmit = async () => {
    console.log('Submit button clicked');
    if (!email) {
      setError('Username is required');
      return;
    }
    // if (!role) {
    //   setError('Role is required');
    //   return;
    // }
    console.log('Sending API request with:', { email, role });
    const response = await apiClient.updateAccess(
      '1.2.1.2.276.0.50.192168001099.7810872.14547392.270',
      email,
      role
    );
    console.log(response);
    if (response.success) {
      console.log(response);
      alert('Share request submitted successfully');
      setIsPopupOpen(false);
      setEmail(''); // Clear the username field
      setRole('');
    } else {
      setError(response.error.user_friendly_message || 'Failed to submit share request');
    }
  };

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
                              <Icon
                                name={isExpanded ? 'chevron-down' : 'chevron-right'}
                                className="mr-4 inline-flex"
                              />
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
                  {/* <td>
                    <button
                      onClick={handleShareClick}
                      className="ml-2 rounded-lg bg-[#4E9F3D] px-4 py-2 text-white hover:border-[#4E9F3D] hover:bg-[#008170]"
                      style={{ border: '2px solid #191A19' }}
                    >
                      Share
                    </button>
                  </td> */}
                </tr>
                {isPopupOpen && ( // Added popup form
                  <tr>
                    <td colSpan={row.length}>
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50">
                        <div className="mx-4 w-full max-w-sm rounded bg-[#1E5128] p-4 shadow-lg">
                          <h2 className="mb-4 text-lg text-white">Share Study</h2>
                          <form
                            onSubmit={e => {
                              e.preventDefault();
                              handleSubmit();
                            }}
                          >
                            {error && <div className="mb-4 text-red-500">{error}</div>}
                            <div className="mb-4">
                              <label
                                className="mb-2 block text-sm font-bold text-white"
                                htmlFor="email"
                              >
                                Username
                              </label>
                              <input
                                className="w-full rounded border border-gray-400 bg-black px-3 py-2 text-white"
                                id="username"
                                type="text"
                                placeholder="Enter username"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                              />
                            </div>
                            <div className="mb-4">
                              <label
                                className="mb-2 block text-sm font-bold text-white"
                                htmlFor="role"
                              >
                                Select Role
                              </label>
                              <select
                                className="w-full rounded border border-gray-400 bg-black px-3 py-2 text-white"
                                id="role"
                                value={role}
                                onChange={e => setRole(e.target.value)}
                              >
                                <option value="viewer">Viewer</option>
                                <option value="editor">Editor</option>
                              </select>
                            </div>
                            <div className="flex justify-between">
                              <button
                                className="rounded bg-[#4E9F3D] px-3 py-2 text-white"
                                type="button"
                                onClick={handleShareClick}
                              >
                                Close
                              </button>
                              <button
                                className="rounded bg-[#4E9F3D] px-3 py-2 text-white"
                                type="submit"
                              >
                                Submit
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
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
  }),
};

export default StudyListTableRow;
