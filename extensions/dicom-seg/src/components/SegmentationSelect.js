import React from 'react';
import Select from 'react-select';

const SegmentationSelect = ({ value, formatOptionLabel, options }) => (
  <Select
    value={value}
    formatOptionLabel={formatOptionLabel}
    styles={segmentationSelectStyles}
    options={options}
  />
);

const segmentationSelectStyles = {
  control: (base, state) => ({
    ...base,
    cursor: 'pointer',
    background: '#151A1F',
    borderRadius: state.isFocused ? '5px 5px 5px 5px' : 5,
    borderColor: state.isFocused ? '#20a5d6' : '#9CCEF9',
    boxShadow: state.isFocused ? null : null,
    minHeight: '50px',
    '&:hover': {
      borderColor: '#20a5d6',
    },
  }),
  menu: base => ({
    ...base,
    borderRadius: 5,
    background: '#151A1F',
  }),
  option: (base, state) => ({
    ...base,
    cursor: 'pointer',
    '&:first-of-type': {
      borderTopLeftRadius: 5,
      borderTopRightRadius: 5,
    },
    '&:last-of-type': {
      borderBottomLeftRadius: 5,
      borderBottomRightRadius: 5,
    },
    background: state.isSelected ? '#16202B' : '#151A1F',
    '&:hover': {
      background: '#16202B',
    },
  }),
};

export default SegmentationSelect;
