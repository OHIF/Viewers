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
  // A component type: it must be rendered (<DataSourceConfigurationComponent />
  // below), never invoked as a plain function — a direct call splices its hooks
  // (useTranslation, useModal, useState/useEffect) into the caller's hook list
  // and breaks the Rules of Hooks, crashing the WorkList route.
  const DataSourceConfigurationComponent = customizationService.getCustomization(
    'ohif.dataSourceConfigurationComponent'
  ) as React.ComponentType | undefined;

  const uploadEnabled = DicomUploadComponent && dataSource.getConfig()?.dicomUploadEnabled;

  if (!uploadEnabled && !DataSourceConfigurationComponent) {
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
      {DataSourceConfigurationComponent ? <DataSourceConfigurationComponent /> : null}
    </div>
  );
}
