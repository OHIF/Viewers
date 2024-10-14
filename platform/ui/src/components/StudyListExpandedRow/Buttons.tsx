import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import apiClient from '../../apis/apiClient';

const Buttons = ({ studyInstanceUid }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [isLabelPopupOpen, setIsLabelPopupOpen] = useState(false);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [accessList, setAccessList] = useState([]);
  const [labels, setLabels] = useState([]); // State for labels
  const [selectedLabels, setSelectedLabels] = useState([]);
  const currentUserEmail = 'currentuser@example.com';

  useEffect(() => {
    // Fetch labels from local storage when the component mounts
    const storedLabels = JSON.parse(localStorage.getItem('labels')) || [];
    setLabels(storedLabels);
  }, []);

  const handleDeleteClick = e => {
    e.stopPropagation();
    setIsDeletePopupOpen(!isDeletePopupOpen);
    setError('');
  };

  const handleShareClick = async e => {
    e.stopPropagation();
    setIsPopupOpen(!isPopupOpen);
    setError('');
    const response = await apiClient.getAccessList(studyInstanceUid);
    if (response.success && response.result && response.result.studies) {
      setAccessList(response.result.studies);
    } else {
      setAccessList([{ email: currentUserEmail, role: 'owner' }]);
    }
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

    // const peopleWithAccess = await apiClient.getAccessList(studyInstanceUid);
    // console.log('names of people -->' + peopleWithAccess);

    const response = await apiClient.updateAccess(studyInstanceUid, email, role);
    console.log('response-->' + response);
    // const peopleWithAccess = await apiClient.getAccessList(studyInstanceUid);
    // console.log('names of people -->' + peopleWithAccess);
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
  const handleDeleteConfirm = async () => {
    console.log('this button was clicked');
    try {
      const deleteStudy = await apiClient.deleteStudy(studyInstanceUid);
      console.log('Study deleted:', deleteStudy);
      if (deleteStudy.success) {
        window.location.reload();
      } else {
        alert(deleteStudy.error.user_friendly_message);
      }
    } catch (error) {
      console.error('Error deleting study:', error);
      setError('Failed to delete the study.');
    }
  };

  const handleLabelClick = e => {
    e.stopPropagation();
    setIsLabelPopupOpen(!isLabelPopupOpen);
    setError('');
    // Fetch labels from local storage when the popup opens
    const storedLabels = JSON.parse(localStorage.getItem('labels')) || [];
    setLabels(storedLabels);
  };

  const handleLabelChange = labelId => {
    setSelectedLabels(prevSelectedLabels =>
      prevSelectedLabels.includes(labelId)
        ? prevSelectedLabels.filter(id => id !== labelId)
        : [...prevSelectedLabels, labelId]
    );
  };

  const handleLabelSubmit = () => {
    try {
      const storedLabels = JSON.parse(localStorage.getItem('labels')) || [];
      const updatedLabels = storedLabels.map(label => {
        if (selectedLabels.includes(label.id)) {
          return {
            ...label,
            studies: [...(label.studies || []), studyInstanceUid],
          };
        } else {
          return {
            ...label,
            studies: (label.studies || []).filter(id => id !== studyInstanceUid),
          };
        }
      });
      localStorage.setItem('labels', JSON.stringify(updatedLabels));
      alert('Labels updated successfully');
      setIsLabelPopupOpen(false);
    } catch (error) {
      setError('An error occurred while updating labels');
      console.error('Local storage error:', error);
    }
  };

  return (
    <div className="w-full bg-black py-4 pl-12 pr-2">
      <div className="sharebutton">
        <button
          onClick={handleShareClick}
          className="ml-2 rounded-lg bg-[#25257c] px-4 py-2 text-white hover:border-[#4E9F3D] hover:bg-[#3842a9]"
          style={{ border: '2px solid #191A19' }}
        >
          Share
        </button>
        <button
          onClick={handleDeleteClick}
          className="ml-2 rounded-lg bg-[#25257c] px-4 py-2 text-white hover:border-[#4E9F3D] hover:bg-[#3842a9]"
          style={{ border: '2px solid #191A19' }}
        >
          Delete
        </button>

        <button
          onClick={handleLabelClick}
          className="ml-2 rounded-lg bg-[#25257c] px-4 py-2 text-white hover:border-[#4E9F3D] hover:bg-[#3842a9]"
          style={{ border: '2px solid #191A19' }}
        >
          Label As
        </button>
      </div>
      {isPopupOpen && ( // Added popup form
        <tr>
          {/* <td colSpan={row.length}> */}
          <td colSpan={2}>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50">
              <div className="mx-4 w-full max-w-sm rounded bg-[#25257c] p-4 shadow-lg">
                <h2 className="mb-4 text-lg text-white">Share Study</h2>
                {accessList.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-white">People with access</h3>
                    <ul className="list-disc pl-5">
                      {accessList.map((person, index) => (
                        <li
                          key={index}
                          className="text-white"
                        >
                          {person.email} ({person.role})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
                      E-mail
                    </label>
                    <input
                      className="w-full rounded border border-gray-400 bg-black px-3 py-2 text-white"
                      id="username"
                      type="text"
                      placeholder="Enter E-mail"
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
                      className="rounded bg-red-600 px-3 py-2 text-white"
                      type="button"
                      onClick={handleShareClick}
                    >
                      Close
                    </button>
                    <button
                      className="rounded bg-[#25257c] px-3 py-2 text-white"
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

      {isLabelPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50">
          <div className="mx-4 w-full max-w-sm rounded bg-[#25257c] p-4 shadow-lg">
            <h2 className="mb-4 text-lg text-white">Label Study</h2>
            {error && <div className="mb-4 text-red-500">{error}</div>}
            <form
              onSubmit={e => {
                e.preventDefault();
                handleLabelSubmit();
              }}
            >
              <div className="mb-4">
                {labels.map(label => (
                  <div
                    key={label.id}
                    className="mb-2 flex items-center"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLabels.includes(label.id)}
                      onChange={() => handleLabelChange(label.id)}
                      className="mr-2"
                    />
                    <label className="text-white">{label.name}</label>
                  </div>
                ))}
              </div>
              <div className="flex justify-between">
                <button
                  className="rounded bg-red-600 px-3 py-2 text-white"
                  type="button"
                  onClick={() => setIsLabelPopupOpen(false)}
                >
                  Close
                </button>
                <button
                  className="rounded bg-[#25257c] px-3 py-2 text-white"
                  type="submit"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeletePopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50">
          <div className="mx-4 w-full max-w-sm rounded bg-[#25257c] p-4 shadow-lg">
            <h2 className="mb-4 text-lg text-white">Delete Study</h2>
            <p className="mb-4 text-white">Are you sure you want to delete this study?</p>
            <div className="flex justify-between">
              <button
                className="rounded bg-red-600 px-3 py-2 text-white"
                type="button"
                onClick={() => setIsDeletePopupOpen(false)}
              >
                Close
              </button>
              <button
                className="rounded bg-[#25257c] px-3 py-2 text-white"
                type="button"
                onClick={handleDeleteConfirm}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
Buttons.propTypes = {
  studyInstanceUid: PropTypes.string.isRequired,
};

export default Buttons;
