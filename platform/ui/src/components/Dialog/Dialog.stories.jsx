import React from 'react';
import Dialog from './Dialog';

export default {
  component: Dialog,
  title: 'Modals/Dialog',
  argTypes: {
    actions: {},
  },
};

const Template = args => <Dialog {...args} />;

export const Default = Template.bind({});

Default.parameters = {
  backgrounds: { default: 'Dark' },
};

Default.args = {
  title: 'Dialog Title',
  text: 'Dialog Text',
  onClose: () => {
    window.alert('Dialog closed');
  },
  noCloseButton: false,
  actions: [
    {
      id: 'cancel',
      text: 'Cancel',
      type: 'cancel',
    },
    {
      id: 'submit',
      text: 'Submit',
      type: 'primary',
    },
  ],
};
