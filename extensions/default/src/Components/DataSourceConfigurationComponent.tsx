import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, useModal } from '@ohif/ui';
import { Types } from '@ohif/core';
import DataSourceConfigurationModalComponent from './DataSourceConfigurationModalComponent';

function DataSourceConfigurationComponent({
  servicesManager,
  extensionManager,
}: withAppTypes): ReactElement {
  const { t } = useTranslation('DataSourceConfiguration');
  const { show, hide } = useModal();

  const { customizationService } = servicesManager.services;

  const [configurationAPI, setConfigurationAPI] = useState<Types.BaseDataSourceConfigurationAPI>();

  const [configuredItems, setConfiguredItems] =
    useState<Array<Types.BaseDataSourceConfigurationAPIItem>>();

  useEffect(() => {
    let shouldUpdate = true;

    const dataSourceChangedCallback = async () => {
      const activeDataSourceDef = extensionManager.getActiveDataSourceDefinition();

      if (!activeDataSourceDef.configuration.configurationAPI) {
        return;
      }

      const { factory: configurationAPIFactory } =
        customizationService.get(activeDataSourceDef.configuration.configurationAPI) ?? {};

      if (!configurationAPIFactory) {
        return;
      }

      const configAPI = configurationAPIFactory(activeDataSourceDef.sourceName);
      setConfigurationAPI(configAPI);

      // New configuration API means that the existing configured items must be cleared.
      setConfiguredItems(null);

      configAPI.getConfiguredItems().then(list => {
        if (shouldUpdate) {
          setConfiguredItems(list);
        }
      });
    };

    const sub = extensionManager.subscribe(
      extensionManager.EVENTS.ACTIVE_DATA_SOURCE_CHANGED,
      dataSourceChangedCallback
    );

    dataSourceChangedCallback();

    return () => {
      shouldUpdate = false;
      sub.unsubscribe();
    };
  }, []);

  const showConfigurationModal = useCallback(() => {
    show({
      content: DataSourceConfigurationModalComponent,
      title: t('Configure Data Source'),
      contentProps: {
        configurationAPI,
        configuredItems,
        onHide: hide,
      },
    });
  }, [configurationAPI, configuredItems]);

  useEffect(() => {
    if (!configurationAPI || !configuredItems) {
      return;
    }

    if (configuredItems.length !== configurationAPI.getItemLabels().length) {
      // Not the correct number of configured items, so show the modal to configure the data source.
      showConfigurationModal();
    }
  }, [configurationAPI, configuredItems, showConfigurationModal]);

  return configuredItems ? (
    <div className="text-aqua-pale flex items-center overflow-hidden">
      <Icon
        name="settings"
        className="mr-2.5 h-3.5 w-3.5 shrink-0 cursor-pointer"
        onClick={showConfigurationModal}
      ></Icon>
      {configuredItems.map((item, itemIndex) => {
        return (
          <div
            key={itemIndex}
            className="flex overflow-hidden"
          >
            <div
              key={itemIndex}
              className="overflow-hidden text-ellipsis whitespace-nowrap"
            >
              {item.name}
            </div>
            {itemIndex !== configuredItems.length - 1 && <div className="px-2.5">|</div>}
          </div>
        );
      })}
    </div>
  ) : (
    <></>
  );
}

export default DataSourceConfigurationComponent;
