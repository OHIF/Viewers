import React, { ReactNode, useCallback, useContext } from 'react';
import { MenuContext } from './Menu';

type ItemProps = {
  label: string;
  secondaryLabel?: string;
  icon?: ReactNode;
  onClick?: () => void;
};

const Item = ({ label, secondaryLabel, icon, onClick }: ItemProps) => {
  const { hideMenu } = useContext(MenuContext);

  const onClickHandler = useCallback(() => {
    hideMenu();
    onClick?.();
  }, [hideMenu, onClick]);

  return (
    <div
      className="all-in-one-menu-item all-in-one-menu-item-effects"
      onClick={onClickHandler}
    >
      {icon && (
        <>
          {icon}
          <div className="w-2"></div>
        </>
      )}
      <span>{label}</span>
      {secondaryLabel != null && (
        <span className="text-aqua-pale ml-[1ch]">{`${secondaryLabel}`}</span>
      )}
    </div>
  );
};

export default Item;
