import PROMPT_RESPONSES from '../utils/_shared/PROMPT_RESPONSES';

/**
 * Creates and shows a report dialog prompt.
 * The input for this is:
 *   - `title` shown in the dialog
 *   - `modality` being stored, used to query existing series
 *   - `minSeriesNumber` is the start of new series of this modality type.
 *     Will get set to 4000 if not determined by the modality
 *   - predecessorImageId is the image id that this series was currently loaded
 *     from.  That allows defaulting the dialog to show the specified series instead
 *     of always creating a new series.
 *
 * The response is:
 *   - `value`, the default name of the object/series being created
 *   - `dataSourceName`, where to store the object to
 *   - `series`, is the series to store do, as referenced by a predecessorImageId value.
 *   - `priorSeriesNumber` is the previously lowest series number at least minSeriesNumber
 *     of all the seris of the given modality type.
 *
 * This should be provided to the DICOM encoder, which will get the predecessor
 * sequence from the metaData provider so that the saved series will replace
 * the existing instance in the same series.
 * This will be falsy for a new series.
 */
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
