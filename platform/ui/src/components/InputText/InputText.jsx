import React from 'react';
import PropTypes from 'prop-types';

import { Input, InputLabelWrapper } from '@ohif/ui';

const InputText = ({
  label,
  isSortable,
  isBeingSorted,
  sortDirection,
  onLabelClick,
  value,
  onChange,
}) => {
  return (
    <InputLabelWrapper
      label={label}
      isSortable={isSortable}
      isBeingSorted={isBeingSorted}
      sortDirection={sortDirection}
      onLabelClick={onLabelClick}
    >
      <Input
        className="border-custom-blue mt-2 bg-black"
        type="text"
        containerClassName="mr-2"
        value={value}
        onChange={event => {
          onChange(event.target.value);
        }}
      />
    </InputLabelWrapper>
  );
};

InputText.defaultProps = {
  label: '',
  isSortable: false,
  isBeingSorted: false,
  sortDirection: 0,
  onLabelClick: () => {},
  value: '',
  inputProps: {},
  onChange: () => {},
};

InputText.propTypes = {
  label: PropTypes.string,
  isSortable: PropTypes.bool,
  isBeingSorted: PropTypes.bool,
  sortDirection: PropTypes.oneOf([-1, 0, 1]),
  onLabelClick: PropTypes.func,
  value: PropTypes.string,
  inputProps: PropTypes.object,
  onChange: PropTypes.func,
};

export default InputText;
