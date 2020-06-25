import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { ToolbarButton } from '@ohif/ui';

function NestedMenu({ children, label, icon }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleNestedMenu = () => setIsOpen(!isOpen);

  const closeNestedMenu = () => {
    if (isOpen) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    window.addEventListener('click', closeNestedMenu);
    return () => {
      window.removeEventListener('click', closeNestedMenu);
    };
  }, [isOpen]);

  const isActive = isOpen || children.props.children.some(c => c.props.isActive);

  return (
    <ToolbarButton
      id="NestedMenu"
      label={label}
      icon={icon}
      onClick={toggleNestedMenu}
      dropdownContent={isOpen && children}
      isActive={isActive}
      type="primary"
    />
  );
}

NestedMenu.propTypes = {
  children: PropTypes.any.isRequired,
  icon: PropTypes.string,
  label: PropTypes.string,
};

NestedMenu.defaultProps = {
  icon: "tool-more-menu",
  label: "More",
};

export default NestedMenu;
