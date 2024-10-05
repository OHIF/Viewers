import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import LegacyButton from '../LegacyButton';
import Icon from '../Icon';
import Typography from '../Typography';
import InputGroup from '../InputGroup';

// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faTrash } from '@fortawesome/free-solid-svg-icons';

const StudyListFilter = ({
  filtersMeta,
  filterValues,
  onChange,
  clearFilters,
  isFiltering,
  numOfStudies,
  onUploadClick,
  getDataSourceConfigurationComponent,
}) => {
  const { t } = useTranslation('StudyList');
  const { sortBy, sortDirection } = filterValues;
  const filterSorting = { sortBy, sortDirection };
  const [instances, setInstances] = useState<any>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedStudyType, setSelectedStudyType] = useState('My Studies');
  const [labels, setLabels] = useState([]);
  const [newLabelName, setNewLabelName] = useState('');
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [labelDropdownOpen, setLabelDropdownOpen] = useState(false);
  const [labelToDelete, setLabelToDelete] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState(null);

  useEffect(() => {
    const savedLabels = JSON.parse(localStorage.getItem('labels')) || [];
    setLabels(savedLabels);
  }, []);

  const saveLabelsToLocalStorage = updatedLabels => {
    localStorage.setItem('labels', JSON.stringify(updatedLabels));
    setLabels(updatedLabels);
  };
  const handleAddLabel = () => {
    if (newLabelName.trim() !== '') {
      const newLabel = { id: Date.now(), name: newLabelName.trim() };
      const updatedLabels = [...labels, newLabel];
      saveLabelsToLocalStorage(updatedLabels);
      setNewLabelName('');
      setIsLabelModalOpen(false);
    }
  };
  const handleLabelClick = label => {
    setSelectedLabel(label);
    // setSelectedStudyType(label.name);
    setLabelDropdownOpen(false);
    window.location.reload();
    // Trigger API call here
    // fetch(`/api/your-endpoint/${label.id}`)
    //   .then(response => response.json())
    //   .then(data => {
    //     // Handle the data received from the API
    //     console.log(data);
    //     // Refresh the component or reload the window if needed
    //     window.location.reload();
    //   })
    //   .catch(error => {
    //     console.error('Error fetching data:', error);
    //   });
  };

  const ManageLabelsButton = () => {
    const [labelDropdownOpen, setLabelDropdownOpen] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState('');
  };
  const handleDeleteLabel = labelId => {
    const updatedLabels = labels.filter(label => label.id !== labelId);
    saveLabelsToLocalStorage(updatedLabels);
    setLabelToDelete(null);
  };

  const setFilterSorting = sortingValues => {
    onChange({
      ...filterValues,
      ...sortingValues,
    });
  };

  const isSortingEnabled = numOfStudies > 0 && numOfStudies <= 100;

  const fetchInstances = () => {
    axios
      .get('http://localhost:8000/api/instances')
      .then(response => {
        console.log(response?.data, 'this is response data');
        setInstances(response?.data);
      })
      .catch(error => {
        console.error('Error fetching the instances:', error);
      });
  };

  if (instances?.length) {
    if (instances?.length === 0) {
      alert('No instances to export');
      return;
    }

    const fields = [
      'FileSize',
      'FileUuid',
      'ID',
      'IndexInSeries',
      'Labels',
      'MainDicomTags.InstanceNumber',
      'MainDicomTags.SOPInstanceUID',
      'ParentSeries',
      'Type',
    ];

    const csv = Papa.unparse(instances);

    // Create a blob and trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'instances.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // **Newly Added**: Toggle dropdown function
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // **Newly Added**: Handle dropdown selection
  const handleSelect = type => {
    setSelectedStudyType(type);
    setDropdownOpen(false);
  };

  const openLabelModal = () => {
    setIsLabelModalOpen(true);
    setLabelDropdownOpen(false);
  };

  const handleDeleteIconClick = labelId => {
    setLabelToDelete(labelId);
  };

  return (
    <React.Fragment>
      <div>
        <div className="bg-black">
          <div className="container relative mx-auto flex flex-col pt-5">
            <div className="mb-5 flex flex-row justify-between">
              <div className="flex min-w-[1px] shrink flex-row items-center gap-6">
                <Typography
                  variant="h6"
                  className="text-white"
                >
                  {t('StudyList')}
                </Typography>
                {getDataSourceConfigurationComponent && getDataSourceConfigurationComponent()}
                {onUploadClick && (
                  <div
                    className="text-primary-active flex cursor-pointer items-center gap-2 self-center text-lg font-semibold"
                    onClick={onUploadClick}
                  >
                    <Icon name="icon-upload"></Icon>
                    <span>{t('Upload')}</span>
                  </div>
                )}
              </div>
              <div className="flex h-[34px] flex-row items-center">
                {/* TODO revisit the completely rounded style of button used for clearing the study list filter - for now use LegacyButton*/}
                {isFiltering && (
                  <LegacyButton
                    rounded="full"
                    variant="outlined"
                    color="primaryActive"
                    border="primaryActive"
                    className="mx-8"
                    startIcon={<Icon name="cancel" />}
                    onClick={clearFilters}
                  >
                    {t('ClearFilters')}
                  </LegacyButton>
                )}

                <div className="relative min-w-[120px] text-left">
                  <button
                    type="button"
                    className="hover:bg-white-50 mt-[10px] mr-3 flex w-full min-w-[110px] items-center justify-center whitespace-nowrap rounded-md bg-[#243fa0] text-sm font-semibold text-white shadow-sm"
                    style={{ marginRight: '10px' }}
                    onClick={() => setLabelDropdownOpen(!labelDropdownOpen)}
                  >
                    Manage Studies
                    {/* {selectedLabel} */}
                    <svg
                      className="-mr-1 ml-2 h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {labelDropdownOpen && (
                    <div
                      className="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                      style={{ zIndex: 1050 }}
                    >
                      <div
                        className="py-1"
                        role="none"
                      >
                        <button
                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                          onClick={openLabelModal}
                        >
                          Create Label
                        </button>
                        {labels.map(label => (
                          <div
                            key={label.id}
                            className="flex cursor-pointer items-center justify-between px-4 py-2 hover:bg-gray-100"
                            onClick={() => handleLabelClick(label)}
                          >
                            <span className="text-sm text-gray-700">{label.name}</span>
                            <button
                              className="text-red-600 hover:text-red-800"
                              onClick={e => {
                                e.stopPropagation();
                                handleDeleteIconClick(label.id);
                              }}
                            >
                              <Icon name="cancel" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative min-w-[120px] text-left">
                  <button
                    type="button"
                    className="hover:bg-white-50 mt-[10px] flex w-full min-w-[120px] items-center justify-center whitespace-nowrap rounded-md bg-[#243fa0] text-sm font-semibold text-white shadow-sm"
                    onClick={toggleDropdown}
                  >
                    {selectedStudyType}
                    <svg
                      className="-mr-1 ml-2 h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  {dropdownOpen && (
                    <div
                      className="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                      style={{ zIndex: 1050 }}
                    >
                      <div
                        className="py-1"
                        role="none"
                      >
                        <button
                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                          onClick={() => handleSelect('My Studies')}
                        >
                          My Studies
                        </button>
                        <button
                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                          onClick={() => handleSelect('Shared by Me')}
                        >
                          Shared by Me
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ marginLeft: '20px' }}>
                  <Typography
                    variant="h6"
                    className="text-primary-light"
                  >
                    {`${t('Number of studies')}: `}
                  </Typography>
                  <Typography
                    variant="h6"
                    className="mr-2"
                    data-cy={'num-studies'}
                  >
                    {numOfStudies > 100 ? '>100' : numOfStudies}
                  </Typography>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="sticky -top-1 z-10 mx-auto border-b-4 border-black">
        <div className="bg-primary-dark pt-3 pb-3">
          <InputGroup
            inputMeta={filtersMeta}
            values={filterValues}
            onValuesChange={onChange}
            sorting={filterSorting}
            onSortingChange={setFilterSorting}
            isSortingEnabled={isSortingEnabled}
          />
        </div>
        {numOfStudies > 100 && (
          <div className="container m-auto">
            <div className="bg-primary-main rounded-b py-1 text-center text-base">
              <p className="text-white">
                {t('Filter list to 100 studies or less to enable sorting')}
              </p>
            </div>
          </div>
        )}
      </div>
      {labelToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          style={{ zIndex: 1051 }}
        >
          <div className="mx-4 w-full max-w-sm rounded bg-[#243fa0] p-4 shadow-lg">
            <p className="mb-4 text-lg text-white">Are you sure you want to delete this label?</p>
            <div className="flex justify-between">
              <button
                className="rounded bg-[#4E9F3D] px-3 py-2 text-white"
                onClick={() => setLabelToDelete(null)}
              >
                Cancel
              </button>
              <button
                className="rounded bg-red-600 px-3 py-2 text-white"
                onClick={() => handleDeleteLabel(labelToDelete)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isLabelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-sm rounded bg-[#243fa0] p-4 shadow-lg">
            <h2 className="mb-4 text-lg">Create New Label</h2>
            <input
              type="text"
              value={newLabelName}
              onChange={e => setNewLabelName(e.target.value)}
              placeholder="Please enter a new label name"
              className="mb-4 w-full rounded border border-gray-400 bg-black px-3 py-2"
            />
            <div className="flex justify-between">
              <button
                className="rounded bg-red-600 px-3 py-2 text-white"
                onClick={() => setIsLabelModalOpen(false)}
              >
                Close
              </button>
              <button
                className="rounded bg-[#243fa0] px-3 py-2 text-white"
                onClick={handleAddLabel}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

StudyListFilter.propTypes = {
  filtersMeta: PropTypes.arrayOf(
    PropTypes.shape({
      /** Identifier used to map a field to it's value in `filterValues` */
      name: PropTypes.string.isRequired,
      /** Friendly label for filter field */
      displayName: PropTypes.string.isRequired,
      /** One of the supported filter field input types */
      inputType: PropTypes.oneOf(['Text', 'MultiSelect', 'DateRange', 'None']).isRequired,
      isSortable: PropTypes.bool.isRequired,
      /** Size of filter field in a 12-grid system */
      gridCol: PropTypes.oneOf([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).isRequired,
      /** Options for a "MultiSelect" inputType */
      option: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.string,
          label: PropTypes.string,
        })
      ),
    })
  ).isRequired,
  filterValues: PropTypes.object.isRequired,
  numOfStudies: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  clearFilters: PropTypes.func.isRequired,
  isFiltering: PropTypes.bool.isRequired,
  onUploadClick: PropTypes.func,
  getDataSourceConfigurationComponent: PropTypes.func,
};

export default StudyListFilter;
