import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Icons, useModal } from '@ohif/ui-next';
import { useCustomization } from '@ohif/core/src';

export function useWorkListToolbarActions(
  dataSource: any,
  onRefresh: () => void,
  isDataSourceInitialized: boolean
): React.ReactNode {
  const { t } = useTranslation();
  const { show, hide } = useModal();

  // Read through useCustomization, not customizationService.getCustomization.
  // The service is a singleton, so a render-time read is memoized by the React
  // Compiler on an identity that never changes — it would run once on mount and
  // then serve that value forever, missing anything a mode registers in
  // onModeEnter. The hook subscribes to the service's change events instead.
  const DicomUploadComponent = useCustomization('dicomUploadComponent') as any;
  // A component type: it must be rendered (<DataSourceConfigurationComponent />
  // below), never invoked as a plain function — a direct call splices its hooks
  // (useTranslation, useModal, useState/useEffect) into the caller's hook list
  // and breaks the Rules of Hooks, crashing the WorkList route.
  const DataSourceConfigurationComponent = useCustomization(
    'ohif.dataSourceConfigurationComponent'
  ) as React.ComponentType | undefined;

  // `isDataSourceInitialized` is a real precondition, not a convenience: the data
  // source fills its config in during initialize() and keeps the same object
  // identity, so a read before then returns nothing and the compiler - keying on
  // that unchanging identity - would cache the miss for good. Gating on the flag
  // gives the value something that actually changes to recompute against.
  const uploadEnabled =
    isDataSourceInitialized && DicomUploadComponent && dataSource.getConfig()?.dicomUploadEnabled;

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
