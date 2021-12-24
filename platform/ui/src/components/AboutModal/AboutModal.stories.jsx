import React from 'react';
import AboutModal from './AboutModal';

export default {
  component: AboutModal,
  title: 'Components/AboutModal',
};

const Template = args => <AboutModal {...args} />;

export const Default = Template.bind({});
Default.args = {
  buildNumber: '1.0.0',
  versionNumber: '1.0.0',
};
