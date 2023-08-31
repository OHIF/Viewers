import classNames from 'classnames';
import React, { ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Icon,
  InputFilterText,
  LoadingIndicatorProgress,
} from '@ohif/ui';
import { Types } from '@ohif/core';

type ItemListComponentProps = {
  itemLabel: string;
  itemList: Array<Types.BaseDataSourceConfigurationAPIItem>;
  onItemClicked: (item: Types.BaseDataSourceConfigurationAPIItem) => void;
};

function ItemListComponent({
  itemLabel,
  itemList,
  onItemClicked,
}: ItemListComponentProps): ReactElement {
  const { t } = useTranslation('DataSourceConfiguration');
  const [filterValue, setFilterValue] = useState('');

  useEffect(() => {
    setFilterValue('');
  }, [itemList]);

  return (
    <div className="flex flex-col gap-4 min-h-[1px] grow">
      <div className="flex justify-between items-center">
        <div className="text-primary-light text-[20px]">
          {t(`Select ${itemLabel}`)}
        </div>
        <InputFilterText
          className="grow max-w-[40%]"
          value={filterValue}
          onDebounceChange={setFilterValue}
          placeholder={t(`Search ${itemLabel} list`)}
        ></InputFilterText>
      </div>
      <div className="flex flex-col relative min-h-[1px] grow text-[14px] bg-black">
        {itemList == null ? (
          <LoadingIndicatorProgress className={'w-full h-full'} />
        ) : itemList.length === 0 ? (
          <div className="flex flex-col h-full px-6 py-4 items-center justify-center text-primary-light">
            <Icon name="magnifier" className="mb-4" />
            <span>{t(`No ${itemLabel} available`)}</span>
          </div>
        ) : (
          <>
            <div className="bg-secondary-dark text-white px-3 py-1.5">
              {t(itemLabel)}
            </div>
            <div className="overflow-auto ohif-scrollbar">
              {itemList
                .filter(
                  item =>
                    !filterValue ||
                    item.name.toLowerCase().includes(filterValue.toLowerCase())
                )
                .map(item => {
                  const border =
                    'rounded border-transparent border-b-secondary-light border-[1px] hover:border-primary-light';
                  return (
                    <div
                      className={classNames(
                        'group mx-2 px-6 py-2 flex justify-between items-center hover:text-primary-light hover:bg-primary-dark',
                        border
                      )}
                      key={item.id}
                    >
                      <div>{item.name}</div>
                      <Button
                        onClick={() => onItemClicked(item)}
                        className="invisible group-hover:visible"
                        endIcon={<Icon name="arrow-left" />}
                      >
                        {t('Select')}
                      </Button>
                    </div>
                  );
                })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ItemListComponent;
