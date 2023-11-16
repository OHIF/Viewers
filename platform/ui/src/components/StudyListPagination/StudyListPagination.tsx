import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import LegacyButton from '../LegacyButton';
import LegacyButtonGroup from '../LegacyButtonGroup';
import Typography from '../Typography';
import Select from '../Select';

const StudyListPagination = ({ onChangePage, currentPage, perPage, onChangePerPage }) => {
  const { t } = useTranslation('StudyList');

  const navigateToPage = page => {
    const toPage = page < 1 ? 1 : page;
    onChangePage(toPage);
  };

  const ranges = [
    { value: '25', label: '25' },
    { value: '50', label: '50' },
    { value: '100', label: '100' },
  ];
  const [selectedRange, setSelectedRange] = useState(ranges.find(r => r.value === perPage));
  const onSelectedRange = selectedRange => {
    setSelectedRange(selectedRange);
    onChangePerPage(selectedRange.value);
  };

  return (
    <div className="bg-black py-10">
      <div className="container relative m-auto px-8">
        <div className="flex justify-between">
          <div className="flex items-center">
            <Select
              id="rows-per-page"
              className="border-primary-main relative mr-3 w-24"
              options={ranges}
              value={selectedRange}
              isMulti={false}
              isClearable={false}
              isSearchable={false}
              closeMenuOnSelect={false}
              hideSelectedOptions={true}
              onChange={onSelectedRange}
            />
            <Typography className="text-base opacity-60">{t('Results per page')}</Typography>
          </div>
          <div className="">
            <div className="flex items-center">
              <Typography className="mr-4 text-base opacity-60">
                {t('Page')} {currentPage}
              </Typography>
              {/* TODO Revisit design of LegacyButtonGroup later - for now use LegacyButton for its children.*/}
              <LegacyButtonGroup>
                <LegacyButton
                  size="initial"
                  className="px-4 py-2 text-base"
                  color="translucent"
                  border="primary"
                  variant="outlined"
                  onClick={() => navigateToPage(1)}
                >
                  {`<<`}
                </LegacyButton>
                <LegacyButton
                  size="initial"
                  className="py-2 px-2 text-base"
                  color="translucent"
                  border="primary"
                  variant="outlined"
                  onClick={() => navigateToPage(currentPage - 1)}
                >
                  {t('Previous')}
                </LegacyButton>
                <LegacyButton
                  size="initial"
                  className="py-2 px-4 text-base"
                  color="translucent"
                  border="primary"
                  variant="outlined"
                  onClick={() => navigateToPage(currentPage + 1)}
                >
                  {t('Next')}
                </LegacyButton>
              </LegacyButtonGroup>
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

export default StudyListPagination;
