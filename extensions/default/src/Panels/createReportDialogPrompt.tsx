import PROMPT_RESPONSES from '../utils/_shared/PROMPT_RESPONSES';

export default function CreateReportDialogPrompt({
  title = 'Create Report',
  extensionManager,
  servicesManager,
}): Promise<{
  value: string;
  dataSourceName: string;
  action: (typeof PROMPT_RESPONSES)[keyof typeof PROMPT_RESPONSES];
}> {
  const { uiDialogService, customizationService } = servicesManager.services;
  const dataSources = extensionManager.getDataSourcesForUI();
  const ReportDialog = customizationService.getCustomization('ohif.createReportDialog');

  const allowMultipleDataSources = window.config.allowMultiSelectExport;

  return new Promise(function (resolve, reject) {
    uiDialogService.show({
      id: 'report-dialog',
      title,
      content: ReportDialog,
      contentProps: {
        dataSources: allowMultipleDataSources ? dataSources : undefined,
        onSave: async ({ reportName, dataSource: selectedDataSource }) => {
          resolve({
            value: reportName,
            dataSourceName: selectedDataSource,
            action: PROMPT_RESPONSES.CREATE_REPORT,
          });
        },
        onCancel: () => {
          resolve({
            action: PROMPT_RESPONSES.CANCEL,
            value: undefined,
            dataSourceName: undefined,
          });
        },
      },
    });
  });
}
