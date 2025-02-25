import React, { ReactNode, useCallback, useContext } from 'react';
import { MenuContext } from './Menu';

type ItemProps = {
  label: string;
  secondaryLabel?: string;
  icon?: ReactNode;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  rightIcon?: ReactNode;
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
  const { hideMenu } = useContext(MenuContext);

  const onClickHandler = useCallback(() => {
    hideMenu();
    onClick?.();
  }, [hideMenu, onClick]);

  return (
    <div
      className="all-in-one-menu-item all-in-one-menu-item-effects"
      onClick={onClickHandler}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {icon && <div className="pr-2">{icon}</div>}
      <span>{label}</span>
      {secondaryLabel != null && <span className="text-aqua-pale ml-[1ch]">{secondaryLabel}</span>}
      {rightIcon && <div className="ml-auto">{rightIcon}</div>}
    </div>
  );
};

export default Item;
