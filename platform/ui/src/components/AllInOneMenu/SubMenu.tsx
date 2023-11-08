import React, { useCallback, useContext } from 'react';
import { MenuContext, MenuProps } from './Menu';
import Icon from '../Icon';

export interface SubMenuProps extends MenuProps {
  itemLabel: string;
  onClick?: () => void;
}

const SubMenu = (props: SubMenuProps) => {
  const { showSubMenu } = useContext(MenuContext);

  const onClickHandler = useCallback(() => {
    showSubMenu(props);
    props.onClick?.();
  }, [showSubMenu, props]);

  return (
    <div
      className="all-in-one-menu-item all-in-one-menu-item-effects flex items-center justify-between"
      onClick={onClickHandler}
    >
      <div>{`${props.itemLabel}`}</div>
      <Icon name="content-next"></Icon>
    </div>
  );
};

export default SubMenu;
