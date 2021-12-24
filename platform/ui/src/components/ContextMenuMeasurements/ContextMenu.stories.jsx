import React from 'react';
import ContextMenuMeasurements from './ContextMenuMeasurements';

export default {
  component: ContextMenuMeasurements,
  title: 'Components/ContextMenuMeasurements',
};

const Template = args => <ContextMenuMeasurements {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  onClose: () => window.alert('onClose'),
  onSetLabel: item => window.alert(`setLabel`),
  onDelete: item => window.alert(`onDelete`),
  onGetMenuItems: defaultMenuItems => defaultMenuItems,
};
