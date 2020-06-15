import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { LayoutSelector as OHIFLayoutSelector, ToolbarButton } from '@ohif/ui';

function LayoutSelector() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function LayoutSelector() {
      if (isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('click', LayoutSelector);
    return () => {
      window.removeEventListener('click', LayoutSelector);
    };
  }, [isOpen]);

  const dropdownContent = isOpen ? OHIFLayoutSelector : undefined;

  return (
    <ToolbarButton
      id="Layout"
      label="Grid Layout"
      icon="tool-layout"
      onClick={() => {
        setIsOpen(!isOpen);
      }}
      dropdownContent={dropdownContent}
      isActive={isOpen}
      type="primary"
    />
  );
}

LayoutSelector.propTypes = {
  children: PropTypes.any.isRequired,
};

export default LayoutSelector;
