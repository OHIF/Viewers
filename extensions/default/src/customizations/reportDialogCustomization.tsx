import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { InputDialog } from '@ohif/ui-next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';

type DataSource = {
  value: string;
  label: string;
  placeHolder: string;
};

type ReportDialogProps = {
  dataSources: DataSource[];
  hide: () => void;
  onSave: (data: { reportName: string; dataSource: string | null; series: string | null }) => void;
  onCancel: () => void;
};

function ReportDialog({ dataSources, hide, onSave, onCancel }: ReportDialogProps) {
  const { servicesManager } = useSystem();
  const [selectedDataSource, setSelectedDataSource] = useState<string | null>(
    dataSources?.[0]?.value ?? null
  );
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [reportName, setReportName] = useState('');

  const { displaySetService } = servicesManager.services;

  const seriesOptions = useMemo(() => {
    const displaySetsMap = displaySetService.getDisplaySetCache();
    const displaySets = Array.from(displaySetsMap.values());
    const options = displaySets
      .filter(ds => ds.Modality === 'SR')
      .map(ds => ({
        value: ds.SeriesInstanceUID,
        description: ds.SeriesDescription,
        label: `${ds.SeriesDescription} ${ds.SeriesDate}/${ds.SeriesTime} ${ds.SeriesNumber}`,
      }));

    return [
      {
        value: null,
        description: null,
        label: 'Create new series',
      },
      ...options,
    ];
  }, [displaySetService]);

  useEffect(() => {
    const seriesOption = seriesOptions.find(s => s.value === selectedSeries);
    const newReportName =
      selectedSeries && seriesOption?.description ? seriesOption.description : '';
    setReportName(newReportName);
  }, [selectedSeries, seriesOptions]);

  const handleSave = useCallback(() => {
    onSave({
      reportName,
      dataSource: selectedDataSource,
      series: selectedSeries,
    });
    hide();
  }, [selectedDataSource, selectedSeries, reportName, hide, onSave]);

  const handleCancel = useCallback(() => {
    onCancel();
    hide();
  }, [onCancel, hide]);

  const showDataSourceSelect = dataSources?.length > 1;

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
                  value={selectedSeries}
                  onValueChange={setSelectedSeries}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a series" />
                  </SelectTrigger>
                  <SelectContent>
                    {seriesOptions.map(series => (
                      <SelectItem
                        key={series.value}
                        value={series.value}
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
                value={selectedSeries}
                onValueChange={setSelectedSeries}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a series" />
                </SelectTrigger>
                <SelectContent>
                  {seriesOptions.map(series => (
                    <SelectItem
                      key={series.value}
                      value={series.value}
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
              <InputDialog.ActionsSecondary onClick={handleCancel}>
                Cancel
              </InputDialog.ActionsSecondary>
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
