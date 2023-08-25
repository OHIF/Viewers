import classNames from 'classnames';
import React, { ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@ohif/ui';
import { Types } from '@ohif/core';
import ItemListComponent from './ItemListComponent';

const NO_WRAP_ELLIPSIS_CLASS_NAMES =
  'text-ellipsis whitespace-nowrap overflow-hidden';

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

  const [itemList, setItemList] = useState<
    Array<Types.BaseDataSourceConfigurationAPIItem>
  >();

  const [selectedItems, setSelectedItems] = useState(configuredItems);

  // Determines whether to show the full configuration for the data source.
  // This typically occurs when the configuration component is first displayed.
  const [showFullConfig, setShowFullConfig] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string>();

  const [itemLabels] = useState(configurationAPI.getItemLabels());

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
          itemIndex !== itemLabels.length - 1
            ? 'hover:bg-transparent active:bg-secondary-dark'
            : ''
        )
      : 'bg-transparent';

  const getSelectedItemBorderClasses = itemIndex =>
    itemIndex === currentSelectedItemIndex + 1
      ? classNames('border-2', 'border-solid', 'border-primary-light')
      : itemIndex < selectedItems.length
      ? 'border border-solid border-primary-active hover:border-primary-light active:border-white'
      : 'border border-dashed border-secondary-light';

  const getSelectedItemTextClasses = itemIndex =>
    itemIndex <= selectedItems.length
      ? 'text-primary-light'
      : 'text-primary-active';

  const getErrorComponent = (): ReactElement => {
    return (
      <div className="flex flex-col gap-4 min-h-[1px] grow">
        <div className="text-primary-light text-[20px]">
          {t(`Error fetching ${itemLabels[selectedItems.length]} list`)}
        </div>
        <div className="bg-black text-[14px] grow p-4">{errorMessage}</div>
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
                'rounded-md p-3.5 flex flex-col gap-1 shrink min-w-[1px] basis-[200px]',
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
                      setSelectedItems(theList =>
                        theList.slice(0, itemLabelIndex)
                      );
                    }
                  : undefined
              }
            >
              <div className="flex gap-2 items-center text-">
                {itemLabelIndex < selectedItems.length ? (
                  <Icon name="status-tracked" />
                ) : (
                  <Icon name="status-untracked" />
                )}
                <div className={classNames(NO_WRAP_ELLIPSIS_CLASS_NAMES)}>
                  {t(itemLabel)}
                </div>
              </div>
              {itemLabelIndex < selectedItems.length ? (
                <div
                  className={classNames(
                    'text-white text-[14px]',
                    NO_WRAP_ELLIPSIS_CLASS_NAMES
                  )}
                >
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
    <div className="h-[calc(100vh-300px)] flex flex-col pt-0.5 gap-4 select-none">
      {getSelectedItemsComponent()}
      <div className="w-full h-0.5 shrink-0 bg-black"></div>
      {errorMessage ? (
        getErrorComponent()
      ) : (
        <ItemListComponent
          itemLabel={itemLabels[currentSelectedItemIndex + 1]}
          itemList={itemList}
          onItemClicked={item => {
            setShowFullConfig(false);
            setSelectedItems(theList => [
              ...theList.slice(0, currentSelectedItemIndex + 1),
              item,
            ]);
          }}
        ></ItemListComponent>
      )}
    </div>
  );
}

export default DataSourceConfigurationModalComponent;
