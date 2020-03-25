import React from 'react';
import PropTypes from 'prop-types';

import { Input, FilterWrapper } from '@ohif/ui';

const FilterText = ({
  label,
  isSortable,
  isBeingSorted,
  sortDirection,
  onLabelClick,
  inputValue,
  inputProps,
  onChange,
}) => {
  return (
    <FilterWrapper
      label={label}
      isSortable={isSortable}
      isBeingSorted={isBeingSorted}
      sortDirection={sortDirection}
      onLabelClick={onLabelClick}
    >
      <Input
        {...inputProps}
        className="border-custom-blue mt-2 bg-black"
        type="text"
        containerClassName="mr-2"
        value={inputValue}
        onChange={event => {
          onChange(event.target.value);
        }}
      />
    </FilterWrapper>
  );
};

FilterText.defaultProps = {
  label: '',
  isSortable: false,
  isBeingSorted: false,
  sortDirection: 0,
  onLabelClick: () => {},
  inputValue: '',
  inputProps: {},
  onChange: () => {},
};

FilterText.propTypes = {
  label: PropTypes.string,
  isSortable: PropTypes.bool,
  isBeingSorted: PropTypes.bool,
  sortDirection: PropTypes.number,
  onLabelClick: PropTypes.func,
  value: PropTypes.string,
  inputProps: PropTypes.object,
  onChange: PropTypes.func,
};

export default FilterText;
