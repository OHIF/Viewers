import { ToolbarButton } from '@ohif/ui';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

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
