import React, { useCallback, useContext } from 'react';
import { MenuContext, MenuProps } from './Menu';
import { Icons } from '@ohif/ui-next';
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
        <Icons.ByName
          name={props.itemIcon}
          className="mr-2"
        ></Icons.ByName>
      )}
      <div className="mr-auto">{props.itemLabel}</div>
      <Icons.ByName name="content-next"></Icons.ByName>
    </div>
  );
};

export default SubMenu;
