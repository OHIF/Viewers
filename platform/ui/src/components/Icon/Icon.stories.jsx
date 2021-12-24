import React from 'react';
import Icon from './Icon';
import { ICONS } from './getIcon';

export default {
  component: Icon,
  title: 'Components/Icon',
  argTypes: {
    name: {
      options: Object.keys(ICONS),
      control: { type: 'select' },
    },
  },
};

const Template = args => (
  <div className="w-32 h-32">
    <Icon {...args} />
  </div>
);

export const Default = Template.bind({});

Default.parameters = {
  backgrounds: { default: 'light' },
};

Default.args = {
  name: 'clipboard',
};
