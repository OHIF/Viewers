import React from 'react';
import EmptyStudies from './EmptyStudies';

export default {
  component: EmptyStudies,
  title: 'Components/EmptyStudies',
};

const Template = args => <EmptyStudies {...args} />;

export const Default = Template.bind({});
