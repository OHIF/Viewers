import PROMPT_RESPONSES from '../utils/_shared/PROMPT_RESPONSES';

export default function CreateReportDialogPrompt({
  title = 'Create Report',
  modality = 'SR',
  minSeriesNumber = 0,
  predecessorImageId,
  extensionManager,
  servicesManager,
}): Promise<{
  value: string;
  dataSourceName: string;
  priorSeriesNumber?: number;
  series: string;
  action: (typeof PROMPT_RESPONSES)[keyof typeof PROMPT_RESPONSES];
}> {
  const { uiDialogService, customizationService } = servicesManager.services;
  const dataSources = extensionManager.getDataSourcesForUI();
  const ReportDialog = customizationService.getCustomization('ohif.createReportDialog');

  const allowMultipleDataSources = window.config.allowMultiSelectExport;

  minSeriesNumber ||=
    (modality === 'SR' && 3000) ||
    (modality === 'SEG' && 3100) ||
    (modality === 'RTSTRUCT' && 3200) ||
    4000;

  return new Promise(function (resolve) {
    uiDialogService.show({
      id: 'report-dialog',
      title,
      content: ReportDialog,
      contentProps: {
        dataSources: allowMultipleDataSources ? dataSources : undefined,
        predecessorImageId,
        minSeriesNumber,
        modality,
        onSave: async ({
          reportName,
          dataSource: selectedDataSource,
          series,
          priorSeriesNumber,
        }) => {
          resolve({
            value: reportName,
            dataSourceName: selectedDataSource,
            series,
            priorSeriesNumber,
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
