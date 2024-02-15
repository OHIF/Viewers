import React, { useContext } from 'react';

import { Icon } from '@ohif/ui';
import DividerItem from './DividerItem';
import { HorizontalDirection, MenuContext } from './Menu';

type BackItemProps = {
  backLabel?: string;
  onBackClick: () => void;
};

const BackItem = ({ backLabel, onBackClick }: BackItemProps) => {
  const { horizontalDirection } = useContext(MenuContext);

  return (
    <>
      <div
        className="all-in-one-menu-item all-in-one-menu-item-effects"
        onClick={onBackClick}
      >
        {horizontalDirection === HorizontalDirection.LeftToRight && (
          <Icon name="content-prev"></Icon>
        )}
        <div className={getLabelClassName(horizontalDirection)}>
          {backLabel || 'Back to Display Options'}
        </div>
        {horizontalDirection === HorizontalDirection.RightToLeft && (
          <Icon name="content-next"></Icon>
        )}
      </div>
      <DividerItem></DividerItem>
    </>
  );
};

const getLabelClassName = (horizontalDirection: HorizontalDirection) =>
  horizontalDirection === HorizontalDirection.LeftToRight ? 'pl-2' : 'mr-auto';
export default BackItem;
