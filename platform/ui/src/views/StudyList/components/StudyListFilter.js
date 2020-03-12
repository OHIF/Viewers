import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { Button, Icon, Input, Typography } from '@ohif/ui';

const sortIconMap = {
  '-1': 'sorting-active-down',
  0: 'sorting',
  1: 'sorting-active-up',
};

const defaultProps = {
  numOfStudies: 0,
  filterMeta: [
    {
      name: 'patientName',
      displayName: 'Patient Name',
      inputType: 'text',
      isSortable: true,
    },
    {
      name: 'mrn',
      displayName: 'MRN',
      inputType: 'text',
      isSortable: true,
    },
    {
      name: 'studyDate',
      displayName: 'Study date',
      inputType: 'text',
      isSortable: true,
    },
    {
      name: 'description',
      displayName: 'Description',
      inputType: 'text',
      isSortable: true,
    },
    {
      name: 'modality',
      displayName: 'Modality',
      inputType: 'text',
      isSortable: true,
    },
    {
      name: 'accession',
      displayName: 'Accession',
      inputType: 'text',
      isSortable: true,
    },
  ],
  filtersValues: {
    patientName: '',
    mrn: '',
    studyDate: '',
    description: '',
    modality: '',
    accession: '',
    sortBy: '',
    sortDirection: 0,
    page: 0,
    resultsPerPage: 25,
  },
};

const FilterLabel = ({
  label = '',
  isSortable = false,
  isBeingSorted = false,
  sortDirection = 0,
  onLabelClick,
  className,
  children,
}) => {
  const handleLabelClick = () => {
    if (onLabelClick) {
      onLabelClick();
    }
  };

  const iconProps = {
    name: isBeingSorted ? sortIconMap[sortDirection] : 'sorting',
    colorClass: isBeingSorted ? 'text-custom-aquaBright' : 'text-custom-blue',
  };

  return (
    <label
      className={classnames(
        'flex flex-col flex-1 text-white text-lg pl-1',
        className
      )}
    >
      <span
        className="flex flex-row items-center cursor-pointer"
        onClick={handleLabelClick}
      >
        {label}
        {isSortable && (
          <Icon
            name={iconProps.name}
            className={classnames('mx-2 w-2', iconProps.colorClass)}
          />
        )}
      </span>
      {children}
    </label>
  );
};

const StudyListFilter = ({
  filtersMeta = defaultProps.filterMeta,
  filtersValues = defaultProps.filtersValues,
  numOfStudies = 90,
}) => {
  const [currentFiltersValues, setcurrentFiltersValues] = useState(
    filtersValues
  );
  const { sortBy, sortDirection } = currentFiltersValues;

  const handleFilterLabelClick = name => {
    let _sortDirection = 1;
    if (sortBy === name) {
      _sortDirection = sortDirection + 1;
      if (_sortDirection > 1) {
        _sortDirection = -1;
      }
    }

    if (numOfStudies <= 100) {
      setcurrentFiltersValues(prevState => ({
        ...prevState,
        sortBy: _sortDirection !== 0 ? name : '',
        sortDirection: _sortDirection,
      }));
    }
  };

  const handleFilterValueChange = (event, name) => {
    const { value } = event.target;
    setcurrentFiltersValues(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    const _filterValues = { ...currentFiltersValues };
    filtersMeta.forEach(filter => {
      if (_filterValues[filter.name]) {
        delete _filterValues[filter.name];
      }
    });
    setcurrentFiltersValues(_filterValues);
  };

  const isFiltering = () => {
    return filtersMeta.some(filter => {
      const filterValue = currentFiltersValues[filter.name];
      return filterValue && filterValue !== '';
    });
  };

  return (
    <div className="bg-custom-navyDark">
      <div className="container m-auto relative flex flex-col pt-5 pb-3 px-4">
        <div className="flex flex-row justify-between mb-5">
          <div className="flex flex-row">
            <Typography variant="h4" className="text-custom-aquaBright mr-6">
              Study List
            </Typography>
            <div className="flex flex-row items-end">
              <Button
                variant="text"
                size="small"
                color="inherit"
                className="text-custom-blueBright"
                startIcon={<Icon name="info-link" className="w-2" />}
              >
                <span className="flex flex-col flex-1">
                  <span>Learn more</span>
                  <span className="opacity-50 pt-1 border-b border-custom-blueBright"></span>
                </span>
              </Button>
            </div>
          </div>
          <div className="flex flex-row items-baseline">
            {isFiltering() && (
              <Button
                rounded="full"
                variant="outlined"
                color="primary"
                className="text-custom-blueBright border-custom-blueBright mx-8"
                startIcon={<Icon name="cancel" />}
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            )}
            <Typography variant="h4" className="text-white mr-2">
              {numOfStudies > 100 ? '>100' : numOfStudies}
            </Typography>
            <Typography variant="h6" className="text-custom-grayLight">
              Studies
            </Typography>
          </div>
        </div>
        <div className="flex flex-row">
          {filtersMeta.map(({ name, displayName, inputType, isSortable }) => {
            return (
              <FilterLabel
                key={name}
                label={displayName}
                isSortable={
                  isSortable && numOfStudies <= 100 && numOfStudies > 0
                }
                isBeingSorted={sortBy === name}
                sortDirection={sortDirection}
                onLabelClick={() => handleFilterLabelClick(name)}
                inputType={inputType}
              >
                <Input
                  className="border-custom-blue mt-2 bg-black"
                  type="text"
                  containerClassName="mr-2"
                  value={currentFiltersValues[name] || ''}
                  onChange={event => handleFilterValueChange(event, name)}
                />
              </FilterLabel>
            );
          })}
          <label className="text-white text-lg pl-1 flex flex-1">
            Instances
          </label>
        </div>
      </div>
    </div>
  );
};

StudyListFilter.propTypes = {
  filtersMeta: PropTypes.arrayOf({
    name: PropTypes.string,
    dsplayName: PropTypes.string,
    inputType: PropTypes.oneOf(['text', 'select', 'date-range', 'none']),
    isSortable: PropTypes.bool,
  }),
  filtersValues: PropTypes.object,
  numOfStudies: PropTypes.number,
};

export default StudyListFilter;
