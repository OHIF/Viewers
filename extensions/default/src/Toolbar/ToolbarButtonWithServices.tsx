import { ToolbarButton } from '@ohif/ui';
import React from 'react';

function ToolbarButtonWithServices({
  id,
  type,
  commands,
  onInteraction,
  servicesManager,
  isActive,
  ...props
}) {
  return (
    <ToolbarButton
      commands={commands}
      id={id}
      type={type}
      isActive={isActive}
      onInteraction={onInteraction}
      {...props}
    />
  );
}

export default ToolbarButtonWithServices;
