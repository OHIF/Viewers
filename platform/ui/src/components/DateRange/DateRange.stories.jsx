import React from 'react';
import DateRange from './DateRange';

export default {
  component: DateRange,
  title: 'Components/DateRange',
};

const Template = args => <DateRange {...args} />;

export const Default = Template.bind({});
Default.args = {
  id: 'date-range-1',
  startDate: '1990-05-01',
  endDate: '2022-01-01',
  // onChange: updatedVal => {
  //   window.alert(JSON.stringify(updatedVal));
  // },
};
