import React, { useCallback, useContext } from 'react';
import { AllInOneMenuContext, AllInOneMenuProps } from './AllInOneMenu';
import Icon from '../Icon';

export interface AllInOneMenuSubMenuProps extends AllInOneMenuProps {
  itemLabel: string;
  onItemClick?: () => void;
}

const AllInOneMenuSubMenu = (props: AllInOneMenuSubMenuProps) => {
  const { showSubMenu } = useContext(AllInOneMenuContext);

  const onClickHandler = useCallback(() => {
    showSubMenu(props);
    props.onItemClick?.();
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

export default AllInOneMenuSubMenu;
