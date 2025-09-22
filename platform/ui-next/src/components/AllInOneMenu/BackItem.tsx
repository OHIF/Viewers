import React from 'react';

import { Icons } from '@ohif/ui-next';
import DividerItem from './DividerItem';
import { useTranslation } from 'react-i18next';

type BackItemProps = {
  backLabel?: string;
  onBackClick: () => void;
};

const BackItem = ({ backLabel, onBackClick }: BackItemProps) => {
  const { t } = useTranslation('Common');

  return (
    <>
      <div
        className="hover:bg-accent flex h-8 w-full flex-shrink-0 cursor-pointer items-center pl-1 pr-2 text-base hover:rounded"
        onClick={onBackClick}
      >
        <Icons.ByName
          name="content-prev"
          className="ml-2 mr-2"
        />
        <span>{backLabel || t('Back')}</span>
      </div>
      <DividerItem></DividerItem>
    </>
  );
};

export default BackItem;
