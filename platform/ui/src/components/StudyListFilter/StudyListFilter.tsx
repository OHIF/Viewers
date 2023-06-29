import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import LegacyButton from '../LegacyButton';
import Icon from '../Icon';
import Typography from '../Typography';
import InputGroup from '../InputGroup';

const StudyListFilter = ({
  filtersMeta,
  filterValues,
  onChange,
  clearFilters,
  isFiltering,
  numOfStudies,
  onUploadClick,
}) => {
  const { t } = useTranslation('StudyList');
  const { sortBy, sortDirection } = filterValues;
  const filterSorting = { sortBy, sortDirection };
  const setFilterSorting = sortingValues => {
    onChange({
      ...filterValues,
      ...sortingValues,
    });
  };
  const isSortingEnabled = numOfStudies > 0 && numOfStudies <= 100;

  return (
    <React.Fragment>
      <div>
        <div className="bg-primary-dark">
          <div className="container relative flex flex-col pt-5 m-auto">
            <div className="flex flex-row justify-between px-12 mb-5">
              <div className="flex flex-row">
                <Typography variant="h4" className="mr-6 text-primary-light">
                  {t('StudyList')}
                </Typography>
                {onUploadClick && (
                  <div
                    className="flex items-center gap-2 cursor-pointer text-primary-active text-lg self-center font-semibold"
                    onClick={onUploadClick}
                  >
                    <Icon name="icon-upload"></Icon>
                    <span>Upload</span>
                  </div>
                )}
              </div>
              <div className="flex flex-row">
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
                <Typography
                  variant="h4"
                  className="mr-2"
                  data-cy={'num-studies'}
                >
                  {numOfStudies > 100 ? '>100' : numOfStudies}
                </Typography>
                <Typography
                  variant="h6"
                  className="self-end pb-1 text-common-light"
                >
                  {t('Studies')}
                </Typography>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="sticky z-10 border-b-4 border-black -top-1">
        <div className="pt-3 pb-3 bg-primary-dark ">
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
            <div className="py-1 text-base text-center rounded-b bg-primary-main">
              <p className="text-white">
                {t('NumOfStudiesHiggerThan100Message')}
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
      /** Identifier used to map a field to it's value in `filterValues` */
      name: PropTypes.string.isRequired,
      /** Friendly label for filter field */
      displayName: PropTypes.string.isRequired,
      /** One of the supported filter field input types */
      inputType: PropTypes.oneOf(['Text', 'MultiSelect', 'DateRange', 'None'])
        .isRequired,
      isSortable: PropTypes.bool.isRequired,
      /** Size of filter field in a 12-grid system */
      gridCol: PropTypes.oneOf([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
        .isRequired,
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
};

export default StudyListFilter;
