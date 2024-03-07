import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { LayoutSelector as OHIFLayoutSelector, ToolbarButton } from '@ohif/ui';
import { ServicesManager } from '@ohif/core';
import { ToolSettings } from '@ohif/ui';

function ToolWithStackedOptions({ servicesManager, options, ...props }) {
  const { toolbarService } = servicesManager.services;

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <ToolSettings options={options} />
    </div>
  );
}

export default ToolWithStackedOptions;
