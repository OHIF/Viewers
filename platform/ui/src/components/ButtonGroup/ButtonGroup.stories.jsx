import React from 'react';
import Button from '../Button/Button';
import ButtonGroup from '../ButtonGroup';

export default {
  component: ButtonGroup,
  title: 'Components/ButtonGroup',
};

export const Default = args => (
  <ButtonGroup {...args}>
    <Button>One</Button>
    <Button>Two</Button>
    <Button>Three</Button>
  </ButtonGroup>
);

Default.args = {
  color: 'default',
  fullWidth: false,
  orientation: 'horizontal',
  size: 'medium',
  variant: 'outlined',
};
