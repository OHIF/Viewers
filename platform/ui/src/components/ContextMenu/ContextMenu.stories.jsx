import React from 'react';
import ContextMenu from './ContextMenu';

export default {
  component: ContextMenu,
  title: 'Modals/ContextMenu',
};

const Template = args => <ContextMenu {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  items: [
    {
      label: 'Delete measurement',
      actionType: 'Delete',
      action: item => {
        window.alert(`${item.label} clicked`);
      },
      value: {},
    },
    {
      label: 'Add Label',
      actionType: 'setLabel',
      action: item => {
        window.alert(`${item.label} clicked`);
      },
      value: {},
    },
  ],
};
