import React, { useCallback, useContext } from 'react';
import { HorizontalDirection, MenuContext, MenuProps } from './Menu';
import Icon from '../Icon';

export interface SubMenuProps extends MenuProps {
  itemLabel: string;
  onClick?: () => void;
  itemIcon?: string;
}

const SubMenu = (props: SubMenuProps) => {
  const { showSubMenu, horizontalDirection } = useContext(MenuContext);

  const onClickHandler = useCallback(() => {
    showSubMenu(props);
    props.onClick?.();
  }, [showSubMenu, props]);

  return (
    <div
      className="all-in-one-menu-item all-in-one-menu-item-effects flex items-center"
      onClick={onClickHandler}
    >
      {horizontalDirection === HorizontalDirection.RightToLeft && <Icon name="content-prev"></Icon>}
      {props.itemIcon && (
        <Icon
          name={props.itemIcon}
          width="20px"
          height="20px"
          className="mr-2"
        ></Icon>
      )}
      <div className={getLabelClassName(horizontalDirection)}>{props.itemLabel}</div>
      {horizontalDirection === HorizontalDirection.LeftToRight && <Icon name="content-next"></Icon>}
    </div>
  );
};

const getLabelClassName = (horizontalDirection: HorizontalDirection) =>
  horizontalDirection === HorizontalDirection.LeftToRight ? 'mr-auto' : 'pl-2';

export default SubMenu;
