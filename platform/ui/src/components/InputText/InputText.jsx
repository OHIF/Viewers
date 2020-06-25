import React from 'react';
import PropTypes from 'prop-types';

import { Input, InputLabelWrapper } from '@ohif/ui';

const InputText = ({
  label,
  isSortable,
  sortDirection,
  onLabelClick,
  value,
  onChange,
  type,
  min,
  max,
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
        min={min}
        max={max}
        type={type}
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
  value: '',
  isSortable: false,
  onLabelClick: () => {},
  sortDirection: 'none',
  type: 'text',
  min: null,
  max: null,
};

InputText.propTypes = {
  label: PropTypes.string.isRequired,
  isSortable: PropTypes.bool,
  sortDirection: PropTypes.oneOf(['ascending', 'descending', 'none']),
  onLabelClick: PropTypes.func,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  type: PropTypes.string,
  /** User for input type=number */
  min: PropTypes.number,
  /** User for input type=number */
  max: PropTypes.number,
};

export default InputText;
