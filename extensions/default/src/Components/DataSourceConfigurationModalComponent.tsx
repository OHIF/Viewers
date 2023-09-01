import classNames from 'classnames';
import React, { ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@ohif/ui';
import { Types } from '@ohif/core';
import ItemListComponent from './ItemListComponent';

const NO_WRAP_ELLIPSIS_CLASS_NAMES = 'text-ellipsis whitespace-nowrap overflow-hidden';

type DataSourceConfigurationModalComponentProps = {
  configurationAPI: Types.BaseDataSourceConfigurationAPI;
  configuredItems: Array<Types.BaseDataSourceConfigurationAPIItem>;
  onHide: () => void;
};

function DataSourceConfigurationModalComponent({
  configurationAPI,
  configuredItems,
  onHide,
}: DataSourceConfigurationModalComponentProps) {
  const { t } = useTranslation('DataSourceConfiguration');

  const [itemList, setItemList] = useState<Array<Types.BaseDataSourceConfigurationAPIItem>>();

  const [selectedItems, setSelectedItems] = useState(configuredItems);

  const [errorMessage, setErrorMessage] = useState<string>();

  const [itemLabels] = useState(configurationAPI.getItemLabels());

  // Determines whether to show the full/existing configuration for the data source.
  // A full or complete configuration is one where the data source (path) has the
  // maximum/required number of path items. Anything less is considered not complete and
  // the configuration starts from scratch (i.e. as if no items are configured at all).
  // TODO: consider configuration starting from a partial (i.e. non-empty) configuration
  const [showFullConfig, setShowFullConfig] = useState(
    itemLabels.length === configuredItems.length
  );

  /**
   * The index of the selected item that is considered current and for which
   * its sub-items should be displayed in the items list component. When the
   * full/existing configuration for a data source is to be shown, the current
   * selected item is the second to last in the `selectedItems` list.
   */
  const currentSelectedItemIndex = showFullConfig
    ? selectedItems.length - 2
    : selectedItems.length - 1;

  useEffect(() => {
    let shouldUpdate = true;

    setErrorMessage(null);

    // Clear out the former/old list while we fetch the next sub item list.
    setItemList(null);

    if (selectedItems.length === 0) {
      configurationAPI
        .initialize()
        .then(items => {
          if (shouldUpdate) {
            setItemList(items);
          }
        })
        .catch(error => setErrorMessage(error.message));
    } else if (!showFullConfig && selectedItems.length === itemLabels.length) {
      // The last item to configure the data source (path) has been selected.
      configurationAPI.setCurrentItem(selectedItems[selectedItems.length - 1]);
      // We can hide the modal dialog now.
      onHide();
    } else {
      configurationAPI
        .setCurrentItem(selectedItems[currentSelectedItemIndex])
        .then(items => {
          if (shouldUpdate) {
            setItemList(items);
          }
        })
        .catch(error => setErrorMessage(error.message));
    }

    return () => {
      shouldUpdate = false;
    };
  }, [
    selectedItems,
    configurationAPI,
    onHide,
    itemLabels,
    showFullConfig,
    currentSelectedItemIndex,
  ]);

  const getSelectedItemCursorClasses = itemIndex =>
    itemIndex !== itemLabels.length - 1 && itemIndex < selectedItems.length
      ? 'cursor-pointer'
      : 'cursor-auto';

  const getSelectedItemBackgroundClasses = itemIndex =>
    itemIndex < selectedItems.length
      ? classNames(
          'bg-black/[.4]',
          itemIndex !== itemLabels.length - 1 ? 'hover:bg-transparent active:bg-secondary-dark' : ''
        )
      : 'bg-transparent';

  const getSelectedItemBorderClasses = itemIndex =>
    itemIndex === currentSelectedItemIndex + 1
      ? classNames('border-2', 'border-solid', 'border-primary-light')
      : itemIndex < selectedItems.length
      ? 'border border-solid border-primary-active hover:border-primary-light active:border-white'
      : 'border border-dashed border-secondary-light';

  const getSelectedItemTextClasses = itemIndex =>
    itemIndex <= selectedItems.length ? 'text-primary-light' : 'text-primary-active';

  const getErrorComponent = (): ReactElement => {
    return (
      <div className="flex min-h-[1px] grow flex-col gap-4">
        <div className="text-primary-light text-[20px]">
          {t(`Error fetching ${itemLabels[selectedItems.length]} list`)}
        </div>
        <div className="grow bg-black p-4 text-[14px]">{errorMessage}</div>
      </div>
    );
  };

  const getSelectedItemsComponent = (): ReactElement => {
    return (
      <div className="flex gap-4">
        {itemLabels.map((itemLabel, itemLabelIndex) => {
          return (
            <div
              key={itemLabel}
              className={classNames(
                'flex min-w-[1px] shrink basis-[200px] flex-col gap-1 rounded-md p-3.5',
                getSelectedItemCursorClasses(itemLabelIndex),
                getSelectedItemBackgroundClasses(itemLabelIndex),
                getSelectedItemBorderClasses(itemLabelIndex),
                getSelectedItemTextClasses(itemLabelIndex)
              )}
              onClick={
                (showFullConfig && itemLabelIndex < currentSelectedItemIndex) ||
                itemLabelIndex <= currentSelectedItemIndex
                  ? () => {
                      setShowFullConfig(false);
                      setSelectedItems(theList => theList.slice(0, itemLabelIndex));
                    }
                  : undefined
              }
            >
              <div className="text- flex items-center gap-2">
                {itemLabelIndex < selectedItems.length ? (
                  <Icon name="status-tracked" />
                ) : (
                  <Icon name="status-untracked" />
                )}
                <div className={classNames(NO_WRAP_ELLIPSIS_CLASS_NAMES)}>{t(itemLabel)}</div>
              </div>
              {itemLabelIndex < selectedItems.length ? (
                <div className={classNames('text-[14px] text-white', NO_WRAP_ELLIPSIS_CLASS_NAMES)}>
                  {selectedItems[itemLabelIndex].name}
                </div>
              ) : (
                <br></br>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-300px)] select-none flex-col gap-4 pt-0.5">
      {getSelectedItemsComponent()}
      <div className="h-0.5 w-full shrink-0 bg-black"></div>
      {errorMessage ? (
        getErrorComponent()
      ) : (
        <ItemListComponent
          itemLabel={itemLabels[currentSelectedItemIndex + 1]}
          itemList={itemList}
          onItemClicked={item => {
            setShowFullConfig(false);
            setSelectedItems(theList => [...theList.slice(0, currentSelectedItemIndex + 1), item]);
          }}
        ></ItemListComponent>
      )}
    </div>
  );
}

export default DataSourceConfigurationModalComponent;
