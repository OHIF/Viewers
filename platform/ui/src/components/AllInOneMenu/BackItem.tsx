import React, { useContext } from 'react';

import { Icon } from '@ohif/ui';
import DividerItem from './DividerItem';
import { MenuContext } from './Menu';

type BackItemProps = {
  backLabel: string;
  onBackClick: () => void;
};

const BackItem = ({ backLabel, onBackClick }: BackItemProps) => {
  const { opensLeftToRight } = useContext(MenuContext);

  return (
    <>
      <div
        className="all-in-one-menu-item all-in-one-menu-item-effects"
        onClick={onBackClick}
      >
        {opensLeftToRight && <Icon name="content-prev"></Icon>}
        <div className={getLabelClassName(opensLeftToRight)}>{backLabel}</div>
        {!opensLeftToRight && <Icon name="content-next"></Icon>}
      </div>
      <DividerItem></DividerItem>
    </>
  );
};

const getLabelClassName = (opensLeftToRight: boolean) => (opensLeftToRight ? 'pl-2' : 'mr-auto');
export default BackItem;
