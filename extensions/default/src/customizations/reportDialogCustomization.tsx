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

type ReportDialogProps = {
  dataSources: DataSource[];
  modality?: string;
  predecessorImageId?: string;
  minSeriesNumber?: number;
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

type SaveMode = 'existing' | 'new';

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

  const existingSeriesOptions = useMemo(() => {
    const displaySetsMap = displaySetService.getDisplaySetCache();
    const displaySets = Array.from(displaySetsMap.values());
    return displaySets
      .filter(ds => ds.Modality === modality)
      .map(ds => ({
        value: ds.predecessorImageId || ds.SeriesInstanceUID,
        seriesNumber: isFinite(ds.SeriesNumber) ? ds.SeriesNumber : minSeriesNumber,
        description: ds.SeriesDescription ?? '',
        label: `${ds.SeriesDescription} ${ds.SeriesDate}/${ds.SeriesTime} ${ds.SeriesNumber}`,
      }));
  }, [displaySetService, modality, minSeriesNumber]);

  const hasExistingSeries = existingSeriesOptions.length > 0;

  const [saveMode, setSaveMode] = useState<SaveMode>(hasExistingSeries ? 'existing' : 'new');
  const [selectedSeries, setSelectedSeries] = useState<string | null>(
    predecessorImageId
      ? (existingSeriesOptions.find(s => s.value === predecessorImageId)?.value ??
          existingSeriesOptions[0]?.value ??
          null)
      : (existingSeriesOptions[0]?.value ?? null)
  );
  const [newSeriesName, setNewSeriesName] = useState('');

  const priorSeriesNumber = useMemo(
    () => Math.max(minSeriesNumber, ...existingSeriesOptions.map(s => s.seriesNumber)),
    [existingSeriesOptions, minSeriesNumber]
  );

  const existingSeriesDesc = useMemo(
    () => existingSeriesOptions.find(s => s.value === selectedSeries)?.description ?? '',
    [existingSeriesOptions, selectedSeries]
  );

  const switchToNew = useCallback(() => {
    setSaveMode('new');
    setNewSeriesName(prev => prev || (existingSeriesDesc ? `${existingSeriesDesc} copy` : ''));
  }, [existingSeriesDesc]);

  const handleSave = useCallback(() => {
    actionTakenRef.current = true;
    onSave({
      reportName: saveMode === 'existing' ? existingSeriesDesc : newSeriesName,
      dataSource: selectedDataSource,
      priorSeriesNumber,
      series: saveMode === 'existing' ? selectedSeries : null,
    });
    hide();
  }, [
    saveMode,
    existingSeriesDesc,
    newSeriesName,
    selectedDataSource,
    priorSeriesNumber,
    selectedSeries,
    hide,
    onSave,
  ]);

  const handleCancel = useCallback(() => {
    actionTakenRef.current = true;
    onCancel();
    hide();
  }, [onCancel, hide]);

  const handleDownload = useCallback(() => {
    actionTakenRef.current = true;
    onSave({
      reportName: saveMode === 'existing' ? existingSeriesDesc : newSeriesName,
      dataSource: 'download',
      priorSeriesNumber,
      series: saveMode === 'existing' ? selectedSeries : null,
    });
    hide();
  }, [
    saveMode,
    existingSeriesDesc,
    newSeriesName,
    priorSeriesNumber,
    selectedSeries,
    hide,
    onSave,
  ]);

  // Handles the close dialog button/external close as a cancel
  useEffect(() => {
    return () => {
      if (!actionTakenRef.current) {
        onCancel();
      }
    };
  }, [onCancel]);

  const showDataSourceSelect = dataSources?.length > 1;

  return (
    <div className="text-foreground flex min-w-[400px] max-w-md flex-col">
      <div className="flex flex-col gap-4">
        {showDataSourceSelect && (
          <div>
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
        )}

        {/* Save to existing series */}
        <div>
          <label className="mb-2 flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="save-mode"
              checked={saveMode === 'existing'}
              onChange={() => setSaveMode('existing')}
              disabled={!hasExistingSeries}
              className="cursor-pointer"
            />
            <span className={!hasExistingSeries ? 'text-muted-foreground' : ''}>
              Save to existing series
            </span>
          </label>
          <div className="pl-6">
            <Select
              value={selectedSeries}
              onValueChange={setSelectedSeries}
              disabled={saveMode !== 'existing' || !hasExistingSeries}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={hasExistingSeries ? 'Select a series' : 'No existing series'}
                />
              </SelectTrigger>
              <SelectContent>
                {existingSeriesOptions.map(series => (
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
        </div>

        {/* Create new series — entire section clickable to switch mode */}
        <div onClick={saveMode === 'existing' ? switchToNew : undefined}>
          <label className="mb-2 flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="save-mode"
              checked={saveMode === 'new'}
              onChange={switchToNew}
              className="cursor-pointer"
            />
            <span>Create new series</span>
          </label>
          <div className="pl-6">
            <InputDialog
              value={saveMode === 'existing' ? existingSeriesDesc : newSeriesName}
              onChange={saveMode === 'new' ? setNewSeriesName : undefined}
              submitOnEnter
            >
              <InputDialog.Field className="mb-0">
                <InputDialog.Input
                  placeholder="Series name"
                  disabled={saveMode === 'existing'}
                />
              </InputDialog.Field>
            </InputDialog>
            {saveMode === 'existing' && (
              <p className="text-muted-foreground mt-1 pl-1 text-xs">
                Series name cannot be changed here
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <InputDialog>
            <InputDialog.Actions>
              {enableDownload && (
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
