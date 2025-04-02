import React, { ReactNode } from 'react';
import { Icons } from '@ohif/ui-next';

type ItemProps = {
  label: string;
  secondaryLabel?: string;
  icon?: ReactNode;
  rightIcon?: ReactNode;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

const Item = ({
  label,
  secondaryLabel,
  icon,
  rightIcon,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: ItemProps) => {
  return (
    <div
      className="all-in-one-menu-item all-in-one-menu-item-effects flex items-center"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {icon && <div className="mr-2">{icon}</div>}
      <div className="mr-auto">{label}</div>
      {secondaryLabel && <div className="text-aqua-pale ml-2">{secondaryLabel}</div>}
      {rightIcon && <div className="ml-2">{rightIcon}</div>}
    </div>
  );
};

export default Item;