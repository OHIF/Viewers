import React from 'react';
import InputDateRange from './InputDateRange';

export default {
  component: InputDateRange,
  title: 'Components/InputDateRange',
};

const Template = args => <InputDateRange {...args} />;

export const Default = Template.bind({});

Default.args = {
  id: 'input-date-range',
  label: 'Input Date Range',
  isSortable: true,
  sortDirection: 'ascending',
  onLabelClick: () => {
    alert('onLabelClick');
  },
  value: {
    startDate: '19921022',
    endDate: '19921022',
  },
  onChange: () => {
    alert('onChange');
  },
};
