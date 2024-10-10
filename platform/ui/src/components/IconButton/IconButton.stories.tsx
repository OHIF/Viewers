import React from 'react';
import IconButton from './IconButton';
import Icon from '../Icon/Icon';
import { ICONS } from '../Icon/getIcon';

export default {
  component: IconButton,
  title: 'Icons/IconButton',
  argTypes: {
    iconName: {
      control: { type: 'select', options: Object.keys(ICONS) },
    },
  },
};

const Template = ({ iconName, ...args }) => (
  <IconButton {...args}>
    <Icon name={iconName} />
  </IconButton>
);

export const Default = Template.bind({});

Default.args = {
  iconName: 'clipboard',
};
