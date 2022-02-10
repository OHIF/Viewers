import React from 'react';
import Button from './Button';

export default {
  component: Button,
  title: 'Components/Button',
}

const Template = (args) => <Button {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  children: 'Click Me'
};
