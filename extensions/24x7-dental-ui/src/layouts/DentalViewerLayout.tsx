import React from 'react';
import { AppConfigProvider, useAppConfig } from '@state';

export function createDentalViewerLayout(extensionManager: any) {
  return function DentalViewerLayout(props: any) {
    const [outerAppConfig] = useAppConfig() || [{}, () => {}];
    const dentalAppConfig = { ...outerAppConfig, showPatientInfo: 'visible' };

    const defaultEntry = extensionManager.getModuleEntry(
      '@ohif/extension-default.layoutTemplateModule.viewerLayout'
    );
    const DefaultLayout = defaultEntry?.component;

    if (!DefaultLayout) {
      console.error(
        '[dental-ui] Default ViewerLayout not found — check extension registration order.'
      );
      return null;
    }

    return (
      <AppConfigProvider value={dentalAppConfig}>
        <DefaultLayout {...props} />
      </AppConfigProvider>
    );
  };
}
