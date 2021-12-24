import React from 'react';
import Dropdown from './Dropdown';

export default {
  component: Dropdown,
  title: 'Components/Dropdown',
};

const Template = args => (
  <div className="flex">
    <Dropdown {...args} />
  </div>
);

export const Default = Template.bind({});
export const WithItems = Template.bind({});

Default.args = {
  id: 'dropdown-d',
  list: [],
};

WithItems.args = {
  id: 'dropdown-1',
  children: <div>Drop Down</div>,
  showDropdownIcon: true,
  list: [
    {
      title: 'Item 1',
      icon: 'clipboard',
      onClick: () => {
        alert('Item 1 clicked');
      },
    },
    {
      title: 'Item 2',
      icon: 'tracked',
      onClick: () => {
        alert('Item 2 clicked');
      },
    },
  ],
};
