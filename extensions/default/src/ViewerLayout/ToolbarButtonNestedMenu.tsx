import React, { useEffect, useState } from 'react';
import { ToolbarButton } from '@ohif/ui';

interface NestedMenuProps {
  children: any;
  icon?: string;
  label?: string;
}

function NestedMenu({
  children,
  label = 'More',
  icon = 'tool-more-menu',
  isActive
}: NestedMenuProps) {
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

  return (
    <ToolbarButton
      id="NestedMenu"
      label={label}
      icon={icon}
      onClick={toggleNestedMenu}
      dropdownContent={isOpen && children}
      isActive={isActive || isOpen}
      type="primary"
    />
  );
}

export default NestedMenu;
