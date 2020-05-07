import React from 'react';
import PropTypes from 'prop-types';

import { Button, Icon, Typography, InputGroup } from '@ohif/ui';

const StudyListFilter = ({
  filtersMeta,
  filterValues,
  onChange,
  clearFilters,
  isFiltering,
  numOfStudies,
}) => {
  const { sortBy, sortDirection } = filterValues;
  const filterSorting = { sortBy, sortDirection };
  const setFilterSorting = sortingValues => {
    onChange({
      ...filterValues,
      ...sortingValues,
    });
  };
  const isSortingEnable = numOfStudies > 0 && numOfStudies <= 100;

  return (
    <React.Fragment>
      <div>
        <div className="bg-primary-dark">
          <div className="container m-auto relative flex flex-col pt-5">
            <div className="flex flex-row justify-between mb-5 px-12">
              <div className="flex flex-row">
                <Typography variant="h4" className="text-primary-light mr-6">
                  Study List
                </Typography>
                <div className="flex flex-row items-end">
                  <Button
                    variant="text"
                    size="small"
                    color="inherit"
                    className="text-primary-active"
                    startIcon={<Icon name="info-link" className="w-2" />}
                  >
                    <span className="flex flex-col flex-1">
                      <span>Learn more</span>
                      <span className="opacity-50 pt-1 border-b border-primary-active"></span>
                    </span>
                  </Button>
                </div>
              </div>
              <div className="flex flex-row">
                {isFiltering && (
                  <Button
                    rounded="full"
                    variant="outlined"
                    color="primary"
                    className="text-primary-active border-primary-active mx-8"
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
                  className="text-common-light self-end pb-1"
                >
                  Studies
                </Typography>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="sticky z-10 border-b-4 border-black"
        style={{ top: '57px' }}
      >
        <div className="bg-primary-dark pt-3 pb-3 ">
          <InputGroup
            inputMeta={filtersMeta}
            values={filterValues}
            onValuesChange={onChange}
            sorting={filterSorting}
            onSortingChange={setFilterSorting}
            isSortingEnable={isSortingEnable}
          />
        </div>
        {numOfStudies > 100 && (
          <div className="container m-auto">
            <div className="bg-primary-main text-center text-base py-1 rounded-b">
              <p className="text-white">
                Filter list to 100 studies or less to enable sorting
              </p>
            </div>
          </div>
        )}
      </div>
    </React.Fragment>
  );
};

StudyListFilter.propTypes = {
  filtersMeta: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      displayName: PropTypes.string.isRequired,
      inputType: PropTypes.oneOf(['Text', 'MultiSelect', 'DateRange', 'None'])
        .isRequired,
      isSortable: PropTypes.bool.isRequired,
      gridCol: PropTypes.oneOf([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
        .isRequired,
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
};

export default StudyListFilter;
