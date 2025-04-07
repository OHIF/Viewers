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
      className="hover:bg-accent flex h-8 w-full flex-shrink-0 cursor-pointer items-center px-2 text-base leading-[18px] hover:rounded"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {icon && <div className="mr-2 flex-shrink-0">{icon}</div>}
      <span className="flex-shrink-0">{label}</span>
      {secondaryLabel && <span className="text-muted-foreground ml-2 flex-shrink-0">{secondaryLabel}</span>}
      {rightIcon && <div className="ml-auto flex-shrink-0">{rightIcon}</div>}
    </div>
  );
};

export default Item;