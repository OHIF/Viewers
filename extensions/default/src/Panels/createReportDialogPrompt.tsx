import PROMPT_RESPONSES from '../utils/_shared/PROMPT_RESPONSES';

export default function CreateReportDialogPrompt({
  title = 'Create Report',
  modality = 'SR',
  extensionManager,
  servicesManager,
}): Promise<{
  value: string;
  dataSourceName: string;
  series: string;
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
        modality,
        onSave: async ({ reportName, dataSource: selectedDataSource, series }) => {
          resolve({
            value: reportName,
            dataSourceName: selectedDataSource,
            series,
            action: PROMPT_RESPONSES.CREATE_REPORT,
          });
        },
        onCancel: () => {
          resolve({
            action: PROMPT_RESPONSES.CANCEL,
            value: undefined,
            series: undefined,
            dataSourceName: undefined,
          });
        },
        defaultValue: title,
      },
    });
  });
}
