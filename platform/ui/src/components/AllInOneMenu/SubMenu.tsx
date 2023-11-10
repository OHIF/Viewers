import React, { useCallback, useContext } from 'react';
import { MenuContext, MenuProps } from './Menu';
import Icon from '../Icon';

export interface SubMenuProps extends MenuProps {
  itemLabel: string;
  onClick?: () => void;
}

const SubMenu = (props: SubMenuProps) => {
  const { showSubMenu, opensLeftToRight } = useContext(MenuContext);

  const onClickHandler = useCallback(() => {
    showSubMenu(props);
    props.onClick?.();
  }, [showSubMenu, props]);

  return (
    <div
      className="all-in-one-menu-item all-in-one-menu-item-effects flex items-center"
      onClick={onClickHandler}
    >
      {!opensLeftToRight && <Icon name="content-prev"></Icon>}
      <div className={getLabelClassName(opensLeftToRight)}>{props.itemLabel}</div>
      {opensLeftToRight && <Icon name="content-next"></Icon>}
    </div>
  );
};

const getLabelClassName = (opensLeftToRight: boolean) => (opensLeftToRight ? 'mr-auto' : 'pl-2');

export default SubMenu;
