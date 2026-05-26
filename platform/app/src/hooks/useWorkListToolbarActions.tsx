import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Icons, useModal } from '@ohif/ui-next';
import { ServicesManager } from '@ohif/core';

export function useWorkListToolbarActions(
  servicesManager: ServicesManager,
  dataSource: any,
  onRefresh: () => void
): React.ReactNode {
  const { t } = useTranslation();
  const { show, hide } = useModal();
  const { customizationService } = servicesManager.services;

  const DicomUploadComponent = customizationService.getCustomization('dicomUploadComponent') as any;
  const dataSourceConfigurationComponent = customizationService.getCustomization(
    'ohif.dataSourceConfigurationComponent'
  ) as any;

  const uploadEnabled = DicomUploadComponent && dataSource.getConfig()?.dicomUploadEnabled;
  const dataSourceConfigElement = dataSourceConfigurationComponent?.();

  if (!uploadEnabled && !dataSourceConfigElement) {
    return undefined;
  }

  const uploadProps = uploadEnabled
    ? {
        title: 'Upload files',
        containerClassName: DicomUploadComponent?.containerClassName,
        closeButton: true,
        shouldCloseOnEsc: false,
        shouldCloseOnOverlayClick: false,
        content: () => (
          <DicomUploadComponent
            dataSource={dataSource}
            onComplete={() => {
              hide();
              onRefresh();
            }}
            onStarted={() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              show({ ...uploadProps, closeButton: false } as any);
            }}
          />
        ),
      }
    : undefined;

  return (
    <div className="flex items-center gap-1">
      {uploadProps && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={() => show(uploadProps as any)}
        >
          <Icons.Upload className="h-4 w-4" />
          {t('Upload')}
        </Button>
      )}
      {dataSourceConfigElement}
    </div>
  );
}
