import React from 'react';
import Header from './Header';

export default {
  component: Header,
  title: 'Components/Header',
  argTypes: {
    actions: {},
  },
};

const Template = args => <Header {...args} />;

export const Default = Template.bind({});

Default.args = {
  menuOptions: [
    {
      title: 'About',
      icon: 'info',
      onClick: () => window.alert('About clicked'),
    },
  ],
  isReturnEnabled: true,
  isSticky: false,
  onClickReturnButton: () => window.alert('Return clicked'),
};
