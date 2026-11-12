import React from 'react';
import PropTypes from 'prop-types';

import Input from '../Input';
import InputLabelWrapper from '../InputLabelWrapper';

const InputText = ({
  id,
  label,
  isSortable = false,
  sortDirection = 'none',
  onLabelClick = () => {},
  value = '',
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
        id={id}
        className="mt-2"
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

InputText.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string.isRequired,
  isSortable: PropTypes.bool,
  sortDirection: PropTypes.oneOf(['ascending', 'descending', 'none']),
  onLabelClick: PropTypes.func,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
};

export default InputText;
