import classNames from 'classnames';
import React, { ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Icon, InputFilterText, LoadingIndicatorProgress } from '@ohif/ui';
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
    <div className="flex min-h-[1px] grow flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-primary-light text-[20px]">{t(`Select ${itemLabel}`)}</div>
        <InputFilterText
          className="max-w-[40%] grow"
          value={filterValue}
          onDebounceChange={setFilterValue}
          placeholder={t(`Search ${itemLabel} list`)}
        ></InputFilterText>
      </div>
      <div className="relative flex min-h-[1px] grow flex-col bg-black text-[14px]">
        {itemList == null ? (
          <LoadingIndicatorProgress className={'h-full w-full'} />
        ) : itemList.length === 0 ? (
          <div className="text-primary-light flex h-full flex-col items-center justify-center px-6 py-4">
            <Icon
              name="magnifier"
              className="mb-4"
            />
            <span>{t(`No ${itemLabel} available`)}</span>
          </div>
        ) : (
          <>
            <div className="bg-secondary-dark px-3 py-1.5 text-white">{t(itemLabel)}</div>
            <div className="ohif-scrollbar overflow-auto">
              {itemList
                .filter(
                  item =>
                    !filterValue || item.name.toLowerCase().includes(filterValue.toLowerCase())
                )
                .map(item => {
                  const border =
                    'rounded border-transparent border-b-secondary-light border-[1px] hover:border-primary-light';
                  return (
                    <div
                      className={classNames(
                        'hover:text-primary-light hover:bg-primary-dark group mx-2 flex items-center justify-between px-6 py-2',
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
