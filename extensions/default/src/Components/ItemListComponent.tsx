import classNames from 'classnames';
import React, { ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSystem } from '@ohif/core';
import { Button, Icons, InputFilter } from '@ohif/ui-next';
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
  const { servicesManager } = useSystem();
  const { t } = useTranslation('DataSourceConfiguration');
  const [filterValue, setFilterValue] = useState('');

  useEffect(() => {
    setFilterValue('');
  }, [itemList]);

  const LoadingIndicatorProgress = servicesManager.services.customizationService.getCustomization(
    'ui.loadingIndicatorProgress'
  );

  return (
    <div className="flex min-h-[1px] grow flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-highlight text-xl">{t(`Select ${itemLabel}`)}</div>
        <InputFilter
          className="max-w-[40%] grow"
          onChange={setFilterValue}
        >
          <InputFilter.SearchIcon />
          <InputFilter.Input
            placeholder={t(`Search ${itemLabel} list`)}
            className="pl-8 pr-9"
          />
          <InputFilter.ClearButton className="text-primary mr-0.5 p-0.5" />
        </InputFilter>
      </div>
      <div className="relative flex min-h-[1px] grow flex-col bg-black text-[14px]">
        {itemList == null ? (
          <LoadingIndicatorProgress className={'h-full w-full'} />
        ) : itemList.length === 0 ? (
          <div className="text-highlight flex h-full flex-col items-center justify-center px-6 py-4">
            <Icons.ToolMagnify className="mb-4" />
            <span>{t(`No ${itemLabel} available`)}</span>
          </div>
        ) : (
          <>
            <div className="bg-popover text-foreground px-3 py-1.5">{t(itemLabel)}</div>
            <div className="ohif-scrollbar overflow-auto">
              {itemList
                .filter(
                  item =>
                    !filterValue || item.name.toLowerCase().includes(filterValue.toLowerCase())
                )
                .map(item => {
                  const border = 'rounded border-transparent border-b-input border-[1px]';
                  return (
                    <div
                      className={classNames(
                        'hover:text-highlight hover:bg-muted group mx-2 flex items-center justify-between px-6 py-2',
                        border
                      )}
                      key={item.id}
                    >
                      <div className="text-muted-foreground">{item.name}</div>
                      <Button
                        onClick={() => onItemClicked(item)}
                        className="invisible group-hover:visible"
                        variant="default"
                        size="sm"
                      >
                        {t('Select')}
                        <Icons.ChevronRight className="ml-2 h-3 w-3" />
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
