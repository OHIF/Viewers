import React from 'react';

import { Icons } from '@ohif/ui-next';
import DividerItem from './DividerItem';

type BackItemProps = {
  backLabel?: string;
  onBackClick: () => void;
};

const BackItem = ({ backLabel, onBackClick }: BackItemProps) => {
  return (
    <>
      <div
        className="hover:bg-accent flex h-8 w-full flex-shrink-0 cursor-pointer items-center px-2 text-base hover:rounded"
        onClick={onBackClick}
      >
        <Icons.ByName name="content-prev"></Icons.ByName>

        <div className="pl-2">{backLabel || 'Back to Display Options'}</div>
      </div>
      <DividerItem></DividerItem>
    </>
  );
};

export default BackItem;
