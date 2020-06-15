import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { ToolbarButton } from '@ohif/ui';

function NestedToolbar({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function closeNestedToolbar() {
      if (isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('click', closeNestedToolbar);
    return () => {
      window.removeEventListener('click', closeNestedToolbar);
    };
  }, [isOpen]);

  const dropdownContent = isOpen ? children : undefined;

  return (
    <ToolbarButton
      id="More"
      label="More"
      icon="tool-more-menu"
      onClick={() => {
        setIsOpen(!isOpen);
      }}
      dropdownContent={dropdownContent}
      isActive={isOpen}
      type="primary"
    />
  );
}

NestedToolbar.propTypes = {
  children: PropTypes.any.isRequired,
};

export default NestedToolbar;
