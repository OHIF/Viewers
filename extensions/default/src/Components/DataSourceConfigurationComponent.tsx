import classNames from 'classnames';
import React, { ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Icon,
  InputFilterText,
  LoadingIndicatorProgress,
  useModal,
} from '@ohif/ui';
import { ExtensionManager, ServicesManager, Types } from '@ohif/core';
import { BaseDataSourceConfigurationAPI } from 'platform/core/src/types';

const NO_WRAP_ELLIPSIS_CLASS_NAMES =
  'text-ellipsis whitespace-nowrap overflow-hidden';

type DataSourceConfigurationModalComponentProps = {
  configurationAPI: BaseDataSourceConfigurationAPI;
  onHide: () => void;
};

function DataSourceConfigurationModalComponent({
  configurationAPI,
  onHide,
}: DataSourceConfigurationModalComponentProps) {
  const { t } = useTranslation('DataSourceConfiguration');

  const [itemList, setItemList] = useState<
    Array<Types.BaseDataSourceConfigurationAPIItem>
  >();

  const [filterValue, setFilterValue] = useState('');

  const [selectedItems, setSelectedItems] = useState([]);

  const [errorMessage, setErrorMessage] = useState<string>();

  const [itemLabels] = useState(configurationAPI.getItemLabels());

  useEffect(() => {
    let shouldUpdate = true;

    setFilterValue('');

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
    } else if (selectedItems.length === itemLabels.length) {
      // The last item to configure the data source (path) has been selected.
      configurationAPI.setCurrentItem(selectedItems[selectedItems.length - 1]);
      // We can hide the modal dialog now.
      onHide();
    } else {
      configurationAPI
        .setCurrentItem(selectedItems[selectedItems.length - 1])
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
  }, [selectedItems, configurationAPI, onHide, itemLabels]);

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
          const cursor =
            itemLabelIndex < selectedItems.length
              ? 'cursor-pointer'
              : 'cursor-auto';

          const backgroundColor =
            itemLabelIndex < selectedItems.length
              ? 'bg-black/[.4] hover:bg-transparent active:bg-secondary-dark'
              : 'bg-transparent';

          const borderStyle =
            itemLabelIndex <= selectedItems.length
              ? 'border-solid'
              : 'border-dashed';

          const borderColor =
            itemLabelIndex === selectedItems.length
              ? 'border-primary-light'
              : itemLabelIndex < selectedItems.length
              ? 'border-primary-active hover:border-primary-light active:border-white'
              : 'border-secondary-light';

          const borderWidth =
            itemLabelIndex === selectedItems.length ? 'border-2' : 'border';

          const textColor =
            itemLabelIndex <= selectedItems.length
              ? 'text-primary-light'
              : 'text-primary-active';

          return (
            <div
              key={itemLabel}
              className={classNames(
                'rounded-md p-3.5 flex flex-col gap-1 shrink min-w-[1px] basis-[200px]',
                cursor,
                backgroundColor,
                borderWidth,
                borderStyle,
                borderColor,
                textColor
              )}
              onClick={() =>
                setSelectedItems(theList => theList.slice(0, itemLabelIndex))
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

  const getItemListComponent = (): ReactElement => {
    return (
      <div className="flex flex-col gap-4 min-h-[1px] grow">
        <div className="flex justify-between items-center">
          <div className="text-primary-light text-[20px]">
            {t(`Select ${itemLabels[selectedItems.length]}`)}
          </div>
          <InputFilterText
            className="grow max-w-[40%]"
            value={filterValue}
            onDebounceChange={setFilterValue}
            placeholder={t(`Search ${itemLabels[selectedItems.length]} list`)}
          ></InputFilterText>
        </div>
        <div className="flex flex-col relative min-h-[1px] grow text-[14px] bg-black">
          {itemList == null ? (
            <LoadingIndicatorProgress className={'w-full h-full'} />
          ) : itemList.length === 0 ? (
            <div className="flex flex-col h-full px-6 py-4 items-center justify-center text-primary-light">
              <Icon name="magnifier" className="mb-4" />
              <span>
                {t(`No ${itemLabels[selectedItems.length]} available`)}
              </span>
            </div>
          ) : (
            <>
              <div className="bg-secondary-dark text-white px-3 py-1.5">
                {t(itemLabels[selectedItems.length])}
              </div>
              <div className="overflow-auto ohif-scrollbar">
                {itemList.map(item => {
                  if (
                    filterValue &&
                    !item.name.toLowerCase().includes(filterValue.toLowerCase())
                  ) {
                    return;
                  }
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
                        onClick={() =>
                          setSelectedItems(theList => [...theList, item])
                        }
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
  };
  return (
    <div className="h-[calc(100vh-300px)] flex flex-col pt-0.5 gap-4 select-none">
      {getSelectedItemsComponent()}
      <div className="w-full h-0.5 shrink-0 bg-black"></div>
      {errorMessage ? getErrorComponent() : getItemListComponent()}
    </div>
  );
}

type DataSourceConfigurationComponentProps = {
  servicesManager: ServicesManager;
  extensionManager: ExtensionManager;
};

function DataSourceConfigurationComponent({
  servicesManager,
  extensionManager,
}: DataSourceConfigurationComponentProps): ReactElement {
  const { t } = useTranslation('DataSourceConfiguration');
  const { show, hide } = useModal();

  const { customizationService } = servicesManager.services;

  const [configurationAPI, setConfigurationAPI] = useState<
    Types.BaseDataSourceConfigurationAPI
  >();

  const [configuredItemsNameList, setConfiguredItemsNameList] = useState<
    Array<string>
  >();

  useEffect(() => {
    const dataSourceChangedCallback = () => {
      const activeDataSourceDef = extensionManager.getActiveDataSourceDefinition();

      if (activeDataSourceDef.configuration.configurationAPI) {
        const { factory: configurationAPIFactory } =
          customizationService.get(
            activeDataSourceDef.configuration.configurationAPI
          ) ?? {};

        if (configurationAPIFactory) {
          const configAPI = configurationAPIFactory(
            activeDataSourceDef.sourceName
          );
          setConfigurationAPI(configAPI);

          setConfiguredItemsNameList(configAPI.getConfiguredItemsNameList());
        }
      }
    };

    const sub = extensionManager.subscribe(
      extensionManager.EVENTS.ACTIVE_DATA_SOURCE_CHANGED,
      dataSourceChangedCallback
    );

    dataSourceChangedCallback();

    return () => sub.unsubscribe();
  }, []);

  return configuredItemsNameList ? (
    <div
      className="flex text-aqua-pale cursor-pointer overflow-hidden items-center"
      onClick={() =>
        show({
          content: DataSourceConfigurationModalComponent,
          title: t('Configure Data Source'),
          contentProps: {
            configurationAPI,
            onHide: hide,
          },
        })
      }
    >
      <Icon name="settings" className="w-3.5 h-3.5"></Icon>
      <div>&nbsp;</div>
      {configuredItemsNameList.map((itemName, itemIndex) => {
        return (
          <div key={itemIndex} className="flex overflow-hidden">
            <div
              key={itemIndex}
              className="text-ellipsis whitespace-nowrap overflow-hidden"
            >
              {itemName}
            </div>
            {itemIndex !== configuredItemsNameList.length - 1 && (
              <div>&nbsp;|&nbsp;</div>
            )}
          </div>
        );
      })}
    </div>
  ) : (
    <></>
  );
}

export default DataSourceConfigurationComponent;
