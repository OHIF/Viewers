import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { InputDialog } from '@ohif/ui-next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';

type DataSource = {
  value: string;
  label: string;
  placeHolder: string;
};

/** Radix Select item value for "Create new series" (state remains null). */
const NEW_SERIES_SELECT_VALUE = '__new_series_id__';

type SeriesOption = {
  optionKey: string;
  selectValue: string;
  value: string | null;
  seriesNumber: number;
  description: string | null;
  label: string;
};

type ReportDialogProps = {
  dataSources: DataSource[];
  modality?: string;
  predecessorImageId?: string;
  hide: () => void;
  onSave: (data: {
    reportName: string;
    dataSource: string | null;
    series: string | null;
    priorSeriesNumber: number;
  }) => void;
  onCancel: () => void;
  enableDownload?: boolean;
};

function ReportDialog({
  dataSources,
  modality = 'SR',
  predecessorImageId,
  minSeriesNumber = 3000,
  hide,
  onSave,
  onCancel,
  enableDownload = false,
}: ReportDialogProps) {
  const { t } = useTranslation('Buttons');
  const { servicesManager } = useSystem();
  const actionTakenRef = useRef(false);
  const [selectedDataSource, setSelectedDataSource] = useState<string | null>(
    dataSources?.[0]?.value ?? null
  );
  const { displaySetService } = servicesManager.services;

  const [selectedSeries, setSelectedSeries] = useState<string | null>(predecessorImageId || null);
  const [reportName, setReportName] = useState('');

  const seriesOptions = useMemo((): SeriesOption[] => {
    const displaySetsMap = displaySetService.getDisplaySetCache();
    const displaySets = Array.from(displaySetsMap.values());
    const options = displaySets
      .filter(ds => ds.Modality === modality)
      .map(ds => {
        const value = ds.predecessorImageId || ds.SeriesInstanceUID;
        const selectValue = value || ds.displaySetInstanceUID;
        return {
          optionKey: `series-${ds.displaySetInstanceUID}`,
          selectValue,
          value: value || null,
          seriesNumber: isFinite(ds.SeriesNumber) ? ds.SeriesNumber : minSeriesNumber,
          description: ds.SeriesDescription,
          label: `${ds.SeriesDescription} ${ds.SeriesDate}/${ds.SeriesTime} ${ds.SeriesNumber}`,
        };
      })
      .filter(
        option =>
          option.selectValue && option.selectValue !== NEW_SERIES_SELECT_VALUE
      );

    return [
      {
        optionKey: NEW_SERIES_SELECT_VALUE,
        selectValue: NEW_SERIES_SELECT_VALUE,
        value: null,
        description: null,
        seriesNumber: minSeriesNumber,
        label: 'Create new series',
      },
      ...options,
    ];
  }, [displaySetService, modality, minSeriesNumber]);

  const handleSeriesChange = useCallback(
    (selectValue: string) => {
      const option = seriesOptions.find(o => o.selectValue === selectValue);
      setSelectedSeries(
        selectValue === NEW_SERIES_SELECT_VALUE ? null : (option?.value ?? selectValue)
      );
    },
    [seriesOptions]
  );

  useEffect(() => {
    const seriesOption = seriesOptions.find(s => s.value === selectedSeries);
    const newReportName =
      selectedSeries && seriesOption?.description ? seriesOption.description : '';
    setReportName(newReportName);
  }, [selectedSeries, seriesOptions]);

  const handleSave = useCallback(() => {
    actionTakenRef.current = true;
    onSave({
      reportName,
      dataSource: selectedDataSource,
      priorSeriesNumber: Math.max(...seriesOptions.map(it => it.seriesNumber)),
      series: selectedSeries,
    });
    hide();
  }, [selectedDataSource, selectedSeries, reportName, hide, onSave]);

  const handleCancel = useCallback(() => {
    actionTakenRef.current = true;
    onCancel();
    hide();
  }, [onCancel, hide]);

  const handleDownload = useCallback(() => {
    actionTakenRef.current = true;
    onSave({
      reportName,
      dataSource: 'download',
      priorSeriesNumber: Math.max(...seriesOptions.map(it => it.seriesNumber)),
      series: selectedSeries,
    });
    hide();
  }, [selectedDataSource, selectedSeries, reportName, hide, onSave]);

  // Handles the close dialog button/external close as a cancel
  useEffect(() => {
    return () => {
      if (!actionTakenRef.current) {
        onCancel();
      }
    };
  }, [onCancel]);

  const showDataSourceSelect = dataSources?.length > 1;
  const showDownloadButton = enableDownload;
  const selectedSeriesSelectValue =
    selectedSeries == null
      ? NEW_SERIES_SELECT_VALUE
      : (seriesOptions.find(o => o.value === selectedSeries)?.selectValue ??
        selectedSeries);

  return (
    <div className="text-foreground flex min-w-[400px] max-w-md flex-col">
      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          {showDataSourceSelect && (
            <>
              <div className="mt-1 w-1/2">
                <div className="mb-1 pl-1 text-base">Data source</div>
                <Select
                  value={selectedDataSource}
                  onValueChange={setSelectedDataSource}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a data source" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataSources.map(source => (
                      <SelectItem
                        key={source.value}
                        value={source.value}
                      >
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className={showDataSourceSelect ? 'mt-1 w-1/2' : 'mt-1 w-full'}>
                <div className="mb-1 pl-1 text-base">Series</div>
                <Select
                  value={selectedSeriesSelectValue}
                  onValueChange={handleSeriesChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a series" />
                  </SelectTrigger>
                  <SelectContent>
                    {seriesOptions.map(series => (
                      <SelectItem
                        key={series.optionKey}
                        value={series.selectValue}
                      >
                        {series.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
        <div className="flex items-end gap-4">
          {!showDataSourceSelect && (
            <div className="w-1/3">
              <div className="mb-1 pl-1 text-base">Series</div>
              <Select
                value={selectedSeriesSelectValue}
                onValueChange={handleSeriesChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a series" />
                </SelectTrigger>
                <SelectContent>
                  {seriesOptions.map(series => (
                    <SelectItem
                      key={series.optionKey}
                      value={series.selectValue}
                    >
                      {series.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <InputDialog
            value={reportName}
            onChange={setReportName}
            submitOnEnter
            className="flex-1"
          >
            <InputDialog.Field className="mb-0">
              <InputDialog.Input
                placeholder="Report name"
                disabled={!!selectedSeries}
              />
            </InputDialog.Field>
          </InputDialog>
        </div>

        <div className="flex justify-end gap-2">
          <InputDialog>
            <InputDialog.Actions>
              {showDownloadButton && (
                <InputDialog.ActionsSecondary onClick={handleDownload}>
                  {t('Download')}
                </InputDialog.ActionsSecondary>
              )}
              <InputDialog.ActionsPrimary onClick={handleSave}>Save</InputDialog.ActionsPrimary>
            </InputDialog.Actions>
          </InputDialog>
        </div>
      </div>
    </div>
  );
}

export { ReportDialog };
export default {
  'ohif.createReportDialog': ReportDialog,
};
