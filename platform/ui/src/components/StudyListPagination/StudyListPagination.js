import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonGroup, Typography, Select } from '../';
import { useTranslation } from 'react-i18next';
import ConfigPoint from 'config-point';

export function StudyListPagination({
  onChangePage,
  currentPage,
  perPage,
  onChangePerPage,
  configPoint,
}) {
  const { t } = useTranslation('StudyList');

  const navigateToPage = page => {
    const toPage = page < 1 ? 1 : page;
    onChangePage(toPage);
  };

  configPoint = configPoint || StudyListPaginationConfigPoint;
  const ranges = configPoint.ranges;
  const [selectedRange, setSelectedRange] = useState(
    ranges.find(r => r.value === perPage)
  );
  const onSelectedRange = selectedRange => {
    setSelectedRange(selectedRange);
    onChangePerPage(selectedRange.value);
  };

  return (
    <div className="bg-black py-10">
      <div className="container m-auto relative px-8">
        <div className="flex justify-between">
          <div className="flex items-center">
            <Select
              id={'rows-per-page'}
              className="relative mr-3 w-16 border-primary-main"
              options={ranges}
              value={selectedRange}
              isMulti={false}
              isClearable={false}
              isSearchable={false}
              closeMenuOnSelect={false}
              hideSelectedOptions={true}
              onChange={onSelectedRange}
            />
            <Typography className="text-base opacity-60">
              {t('Results per page')}
            </Typography>
          </div>
          <div className="">
            <div className="flex items-center">
              <Typography className="opacity-60 mr-4 text-base">
                Page {currentPage}
              </Typography>
              <ButtonGroup color="primary">
                <Button
                  size="initial"
                  className="border-primary-main px-4 py-2 text-base"
                  color="white"
                  onClick={() => navigateToPage(1)}
                >
                  {`<<`}
                </Button>
                <Button
                  size="initial"
                  className="border-primary-main py-2 px-2 text-base"
                  color="white"
                  onClick={() => navigateToPage(currentPage - 1)}
                >
                  {t(`< Previous`)}
                </Button>
                <Button
                  size="initial"
                  className="border-primary-main py-2 px-4 text-base"
                  color="white"
                  onClick={() => navigateToPage(currentPage + 1)}
                >
                  {t(`Next >`)}
                </Button>
              </ButtonGroup>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

StudyListPagination.propTypes = {
  onChangePage: PropTypes.func.isRequired,
  currentPage: PropTypes.number.isRequired,
  perPage: PropTypes.number.isRequired,
  onChangePerPage: PropTypes.func.isRequired,
};

const StudyListPaginationSettings = {
  reactFunction: StudyListPagination,
  ranges: [
    { value: '25', label: '25' },
    { value: '50', label: '50' },
    { value: '100', label: '100' },
  ],
};

export const StudyListPaginationConfigPoint = ConfigPoint.addConfig("StudyListPaginationConfigPoint", StudyListPaginationSettings);

export default StudyListPagination;
