import React, { useCallback, useContext } from 'react';
import { MenuContext, MenuProps } from './Menu';
import Icon from '../Icon';

export interface SubMenuProps extends MenuProps {
  itemLabel: string;
  onClick?: () => void;
  itemIcon?: string;
}

const SubMenu = (props: SubMenuProps) => {
  const { showSubMenu } = useContext(MenuContext);

  const onClickHandler = useCallback(() => {
    showSubMenu(props);
    props.onClick?.();
  }, [showSubMenu, props]);

  return (
    <div
      className="all-in-one-menu-item all-in-one-menu-item-effects flex items-center"
      onClick={onClickHandler}
    >
      {props.itemIcon && (
        <Icon
          name={props.itemIcon}
          width="25px"
          height="25px"
          className="mr-2"
        ></Icon>
      )}
      <div className="mr-auto">{props.itemLabel}</div>
      <Icon name="content-next"></Icon>
    </div>
  );
};

export default SubMenu;
