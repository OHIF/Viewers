import React from 'react';
import PropTypes from 'prop-types';

import { Input, InputLabelWrapper } from '@ohif/ui';

const InputNumber = ({
  label,
  isSortable,
  sortDirection,
  onLabelClick,
  value,
  onChange,
}) => {
  return (
    <InputLabelWrapper
      label={label}
      isSortable={isSortable}
      sortDirection={sortDirection}
      onLabelClick={onLabelClick}
    >
      <Input
        className="border-primary-main mt-2 bg-black"
        type="number"
        containerClassName="mr-2"
        value={value}
        onChange={event => {
          onChange(event.target.value);
        }}
      />
    </InputLabelWrapper>
  );
};

InputNumber.defaultProps = {
  value: '',
  isSortable: false,
  onLabelClick: () => {},
  sortDirection: 'none',
};

InputNumber.propTypes = {
  label: PropTypes.string.isRequired,
  isSortable: PropTypes.bool,
  sortDirection: PropTypes.oneOf(['ascending', 'descending', 'none']),
  onLabelClick: PropTypes.func,
  value: PropTypes.number,
  onChange: PropTypes.func.isRequired,
};

export default InputNumber;
