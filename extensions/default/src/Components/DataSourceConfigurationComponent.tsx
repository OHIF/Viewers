import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Icons,
  useModal,
  Button,
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  Card,
  CardHeader,
  CardDescription,
  CardContent,
} from '@ohif/ui-next';
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

  const [itemLabels, setItemLabels] = useState<Array<string>>([]);

  useEffect(() => {
    let shouldUpdate = true;

    const dataSourceChangedCallback = async () => {
      const activeDataSourceDef = extensionManager.getActiveDataSourceDefinition();

      if (!activeDataSourceDef?.configuration?.configurationAPI) {
        return;
      }

      const configurationAPIFactory =
        customizationService.getCustomization(activeDataSourceDef.configuration.configurationAPI) ??
        (() => null);

      if (!configurationAPIFactory) {
        return;
      }

      const configAPI = configurationAPIFactory(activeDataSourceDef.sourceName);
      setConfigurationAPI(configAPI);
      setItemLabels(configAPI.getItemLabels());

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
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-sm"
          onClick={showConfigurationModal}
        >
          <Icons.CloudSettings className="h-5 w-5" />
          Source
        </Button>
      </HoverCardTrigger>
      <HoverCardContent
        align="center"
        className="w-72 p-0"
      >
        <Card className="border-0 shadow-none">
          <CardHeader className="p-3 pb-1">
            <CardDescription className="text-sm">
              <span className="text-foreground font-semibold">{t('Data Source')}:</span>{' '}
              {t('Configure the server connection and storage settings')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 p-3 pt-0 text-sm">
            <div className="bg-input col-span-2 my-2 h-px" />
            {itemLabels.map((label, index) => (
              <React.Fragment key={label}>
                <span className="text-muted-foreground">{t(label)}</span>
                <span>{configuredItems[index]?.name ?? '—'}</span>
              </React.Fragment>
            ))}
          </CardContent>
        </Card>
      </HoverCardContent>
    </HoverCard>
  ) : (
    <></>
  );
}

export default DataSourceConfigurationComponent;
