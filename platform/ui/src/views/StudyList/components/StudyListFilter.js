import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { Button, Icon, Input, Typography, Select, DateRange } from '@ohif/ui';

const sortIconMap = {
  '-1': 'sorting-active-down',
  0: 'sorting',
  1: 'sorting-active-up',
};

const defaultProps = {
  filtersValues: {
    patientName: '',
    mrn: '',
    startDate: null,
    endDate: null,
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
        'flex flex-col flex-1 text-white text-lg pl-1 select-none',
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
      <span>{children}</span>
    </label>
  );
};

FilterLabel.propTypes = {
  label: PropTypes.string,
  isSortable: PropTypes.bool,
  isBeingSorted: PropTypes.bool,
  sortDirection: PropTypes.number,
  onLabelClick: PropTypes.func,
  className: PropTypes.string,
  children: PropTypes.node,
};

const StudyListFilter = ({
  filtersMeta = [],
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
    setcurrentFiltersValues(defaultProps.filtersValues);
  };

  const isFiltering = () => {
    return Object.keys(currentFiltersValues).some(name => {
      const filterValue = currentFiltersValues[name];
      return filterValue !== defaultProps.filtersValues[name];
    });
  };

  const renderInput = (inputType, name, { selectOptions }) => {
    switch (inputType) {
      case 'date-range': {
        return (
          <div className="relative">
            <DateRange
              startDate={currentFiltersValues.startDate}
              endDate={currentFiltersValues.endDate}
              onChange={({ startDate, endDate, preset = false }) => {
                setcurrentFiltersValues(state => ({
                  ...state,
                  startDate,
                  endDate,
                }));
              }}
            />
          </div>
        );
      }
      case 'select': {
        return <Select options={selectOptions}></Select>;
      }
      case 'text': {
        return (
          <Input
            className="border-custom-blue mt-2 bg-black"
            type="text"
            containerClassName="mr-2"
            value={currentFiltersValues[name] || ''}
            onChange={event => handleFilterValueChange(event, name)}
          />
        );
      }
      default:
        break;
    }
  };

  return (
    <>
      <div>
        <div className="bg-custom-navyDark">
          <div className="container m-auto relative flex flex-col pt-5">
            <div className="flex flex-row justify-between mb-5 px-12">
              <div className="flex flex-row">
                <Typography
                  variant="h4"
                  className="text-custom-aquaBright mr-6"
                >
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
              <div className="flex flex-row">
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
                <Typography variant="h4" className="mr-2">
                  {numOfStudies > 100 ? '>100' : numOfStudies}
                </Typography>
                <Typography
                  variant="h6"
                  className="text-custom-grayLight self-end pb-1"
                >
                  Studies
                </Typography>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="sticky z-10 border-b-4 border-black" style={{ top: 58 }}>
        <div className="bg-custom-navyDark pt-3 pb-3 ">
          <div className="container m-auto relative flex flex-col">
            <div className="flex flex-row w-full">
              {filtersMeta.map(
                ({
                  name,
                  displayName,
                  inputType,
                  isSortable,
                  gridCol,
                  selectOptions,
                }) => {
                  return (
                    <div
                      key={name}
                      className={classnames(
                        `w-${gridCol}/24`,
                        'pl-4 first:pl-12'
                      )}
                    >
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
                        {renderInput(inputType, name, { selectOptions })}
                      </FilterLabel>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
        {numOfStudies > 100 && (
          <div className="container m-auto">
            <div className="bg-custom-blue text-center text-base py-1 rounded-b">
              <p className="text-white">
                Filter list to 100 studies or less to enable sorting
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

StudyListFilter.propTypes = {
  filtersMeta: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      dsplayName: PropTypes.string,
      inputType: PropTypes.oneOf(['text', 'select', 'date-range', 'none']),
      isSortable: PropTypes.bool,
      gridCol: PropTypes.oneOf([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
    })
  ),
  filtersValues: PropTypes.object,
  numOfStudies: PropTypes.number,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
};

export default StudyListFilter;
