import PROMPT_RESPONSES from '../utils/_shared/PROMPT_RESPONSES';

/**
 * Creates and shows a report dialog prompt.
 * The input for this is:
 *   - `title` shown in the dialog
 *   - `modality` being stored, used to query existing series
 *   - `minSeriesNumber` is the start of new series of this modality type.
 *     Will get set to 4000 if not determined by the modality
 *   - predecessorImageId is the image id that this series was currently loaded
 *     from.  That is the series the dialog offers to extend, and it defaults to
 *     extending it instead of creating a new series.  Without one, the dialog
 *     only offers to create a new series.
 *   - `itemName` is the current name of the item, when the user can edit that
 *     name, such as the segmentation name.  A new series offers this name first.
 *   - `defaultSeriesDescription` is the name for an item that has no other name,
 *     such as 'Contours' or 'Measurements'.  A new series offers this name last.
 *   - `itemType` is the type of item being stored, used as the key that the
 *     series descriptions used before are remembered under.  Defaults to the
 *     modality, so that segmentations, contours and reports are remembered
 *     separately.
 *   - `rememberedDescriptionCount` is how many previously used series
 *     descriptions to remember and offer for this type of item, 0 to remember
 *     none of them.
 *
 * The dialog offers three destinations - `Save to current`, `Save as new` and
 * `Replace existing` - and says which one is in effect.  Each destination stores
 * all of the current data as one object, and the dialog merges nothing.  The
 * behaviour doc describes the destinations, the series that the dialog offers,
 * and the names for a new series:
 * `platform/docs/docs/behaviours/report-dialog-save-destinations.md`.
 *
 * The response is:
 *   - `value`, the series description of the object/series being created.  When
 *     extending an existing series this is that series' existing description,
 *     as an existing series description is not editable.
 *   - `dataSourceName`, where to store the object to
 *   - `series`, is the series to store do, as referenced by a predecessorImageId value.
 *     This is falsy for a new series.
 *   - `seriesNumber` is the series number to store the object as, which is the
 *     value shown (and possibly edited) in the dialog.
 *   - `priorSeriesNumber` is one less than `seriesNumber`, for callers that
 *     compute the series number to store as `1 + priorSeriesNumber`.
 *
 * The `series` value should be provided to the DICOM encoder, which will get the
 * predecessor sequence from the metaData provider so that the saved instance
 * goes into the same series, superseding the existing instance there.
 */
export default function CreateReportDialogPrompt({
  title = 'Save Measurements',
  modality = 'SR',
  minSeriesNumber = 0,
  predecessorImageId,
  itemName = '',
  defaultSeriesDescription = '',
  itemType,
  rememberedDescriptionCount = 5,
  extensionManager,
  servicesManager,
  enableDownload = false,
}): Promise<{
  value: string;
  dataSourceName: string;
  seriesNumber?: number;
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
      // The default dialog width (max-w-md) is narrower than the destination
      // control, which would otherwise stick out past the dialog's edge.
      containerClassName: 'max-w-lg',
      content: ReportDialog,
      contentProps: {
        dataSources: allowMultipleDataSources ? dataSources : undefined,
        predecessorImageId,
        minSeriesNumber,
        itemName,
        defaultSeriesDescription,
        itemType,
        rememberedDescriptionCount,
        modality,
        enableDownload,
        onSave: async ({
          reportName,
          dataSource: selectedDataSource,
          series,
          seriesNumber,
          priorSeriesNumber,
        }) => {
          resolve({
            value: reportName,
            dataSourceName: selectedDataSource,
            series,
            seriesNumber,
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
