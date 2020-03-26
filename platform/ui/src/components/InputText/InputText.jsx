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
}) => {
  return (
    <InputLabelWrapper
      label={label}
      isSortable={isSortable}
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
  sortDirection: 'none',
  onLabelClick: () => {},
  value: '',
  onChange: () => {},
};

InputText.propTypes = {
  label: PropTypes.string,
  isSortable: PropTypes.bool,
  sortDirection: PropTypes.oneOf(['ascending', 'descending', 'none']),
  onLabelClick: PropTypes.func,
  value: PropTypes.string,
  onChange: PropTypes.func,
};

export default InputText;
