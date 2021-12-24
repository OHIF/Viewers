import React from 'react';
import Input from './Input';

export default {
  component: Input,
  title: 'Components/Input',
};

const Template = args => <Input {...args} />;

export const Default = Template.bind({});

Default.args = {
  label: 'Input',
  containerClassName: 'text-white',
  labelClassName: 'text-white',
  className: 'text-white',
  transparent: false,
  type: 'text',
  value: '',
  onChange: () => {},
  onFocus: () => {},
  autoFocus: false,
  onKeyPress: () => {},
  onKeyDown: () => {},
  readOnly: false,
  disabled: false,
};
