import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { ToolbarButton } from '@ohif/ui';

function NestedMenu({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function closeNestedMenu() {
      if (isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('click', closeNestedMenu);
    return () => {
      window.removeEventListener('click', closeNestedMenu);
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

NestedMenu.propTypes = {
  children: PropTypes.any.isRequired,
};

export default NestedMenu;
