import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  cn,
  Icons,
  Input,
  InputDialog,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@ohif/ui-next';
import { useSystem } from '@ohif/core';

import {
  getSeriesDescriptionHistory,
  rememberSeriesDescription,
} from '../utils/seriesDescriptionHistory';

type DataSource = {
  value: string;
  label: string;
  placeHolder: string;
};

/** A series of the stored modality that this save could be added to. */
type ExistingSeries = {
  /** Identifies the series to extend, as a predecessorImageId value. */
  value: string;
  /** Numeric series number, used to compute the next available series number. */
  seriesNumber: number;
  /** Series number as shown to the user, or a placeholder when there isn't one. */
  seriesNumberLabel: string;
  description: string | null;
};

type ReportDialogProps = {
  dataSources: DataSource[];
  modality?: string;
  /**
   * The image id the data being saved was loaded from.  When it belongs to a
   * loaded series, that series can be extended by this save.
   */
  predecessorImageId?: string;
  /** Lowest series number to use for a newly created series of this modality. */
  minSeriesNumber?: number;
  /**
   * Series description to offer when creating a new series - typically the name
   * of the object being saved, such as the segmentation name or 'Contours'.
   */
  defaultSeriesDescription?: string;
  /**
   * The type of item being stored, used as the key the series descriptions used
   * before are remembered under.  Defaults to the modality.
   */
  itemType?: string;
  /**
   * How many previously used series descriptions to remember and offer for this
   * type of item.  0 remembers nothing.
   */
  rememberedDescriptionCount?: number;
  hide: () => void;
  onSave: (data: {
    reportName: string;
    dataSource: string | null;
    series: string | null;
    seriesNumber: number;
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
  defaultSeriesDescription = '',
  itemType,
  rememberedDescriptionCount = 5,
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

  const existingSeries = useMemo((): ExistingSeries[] => {
    const displaySetsMap = displaySetService.getDisplaySetCache();
    const displaySets = Array.from(displaySetsMap.values());

    return displaySets
      .filter(ds => ds.Modality === modality)
      .map(ds => {
        const hasSeriesNumber = isFinite(ds.SeriesNumber);
        return {
          value: ds.predecessorImageId || ds.SeriesInstanceUID,
          seriesNumber: hasSeriesNumber ? Number(ds.SeriesNumber) : minSeriesNumber,
          seriesNumberLabel: hasSeriesNumber ? `${ds.SeriesNumber}` : 'Not specified',
          description: ds.SeriesDescription || null,
        };
      })
      .filter(series => !!series.value);
  }, [displaySetService, modality, minSeriesNumber]);

  /**
   * The series this save can extend - the one the data was loaded from.  There
   * isn't one for data that has never been stored, which is then always saved
   * as a new series.
   */
  const predecessorSeries = useMemo(
    () => existingSeries.find(series => series.value === predecessorImageId) ?? null,
    [existingSeries, predecessorImageId]
  );

  /** The series number offered for a new series - one past the existing ones. */
  const defaultNewSeriesNumber = useMemo(
    () => 1 + Math.max(minSeriesNumber, ...existingSeries.map(series => series.seriesNumber)),
    [existingSeries, minSeriesNumber]
  );

  /**
   * The series descriptions to offer, being the one provided for this data
   * followed by the ones last used for this type of item.  The most recently
   * used one is what gets offered in the field, as it is the most likely one to
   * want again.
   */
  const descriptionOptions = useMemo(() => {
    const history = getSeriesDescriptionHistory(itemType || modality, rememberedDescriptionCount);
    const options = [defaultSeriesDescription, ...history].filter(option => !!option?.trim());

    return options.filter(
      (option, index) =>
        options.findIndex(other => other.toLowerCase() === option.toLowerCase()) === index
    );
  }, [defaultSeriesDescription, itemType, modality, rememberedDescriptionCount]);

  const [extendExisting, setExtendExisting] = useState(!!predecessorSeries);
  const [newSeriesNumber, setNewSeriesNumber] = useState(String(defaultNewSeriesNumber));
  const [newSeriesDescription, setNewSeriesDescription] = useState(
    // The provided description is the first option, so anything after it is a
    // remembered one, and the first of those was the last one used.
    () => descriptionOptions[1] ?? defaultSeriesDescription
  );
  // Radix opens a tooltip when its trigger takes focus, and the dialog focuses
  // the first control in its content on open, which left this tooltip showing
  // before the user had done anything.  Drive it from the pointer instead.
  const [switchTooltipOpen, setSwitchTooltipOpen] = useState(false);
  const [descriptionsOpen, setDescriptionsOpen] = useState(false);
  // Typing narrows the list to what it can complete; opening the list from its
  // button shows everything on offer.
  const [descriptionsFiltered, setDescriptionsFiltered] = useState(false);
  const [highlightedDescription, setHighlightedDescription] = useState(-1);

  const isExtending = extendExisting && !!predecessorSeries;

  /** The options completing what has been typed so far, in offered order. */
  const descriptionCompletions = useMemo(() => {
    const typed = newSeriesDescription.trim().toLowerCase();
    return descriptionOptions.filter(option => option.toLowerCase().startsWith(typed));
  }, [descriptionOptions, newSeriesDescription]);

  const shownDescriptions = descriptionsFiltered ? descriptionCompletions : descriptionOptions;

  const acceptDescription = useCallback((description: string) => {
    setNewSeriesDescription(description);
    setDescriptionsOpen(false);
    setHighlightedDescription(-1);
  }, []);

  const handleDescriptionChange = useCallback((description: string) => {
    setNewSeriesDescription(description);
    setHighlightedDescription(-1);
    setDescriptionsFiltered(true);
    setDescriptionsOpen(true);
  }, []);

  // An emptied or otherwise unusable series number falls back to the offered one
  // rather than storing something invalid.
  const parsedSeriesNumber = Number.parseInt(newSeriesNumber, 10);
  const seriesNumber = Number.isFinite(parsedSeriesNumber)
    ? parsedSeriesNumber
    : defaultNewSeriesNumber;

  const submit = useCallback(
    (dataSource: string | null) => {
      actionTakenRef.current = true;
      const storedSeriesNumber = isExtending ? predecessorSeries.seriesNumber : seriesNumber;
      // An existing series keeps its own description, so there is nothing for
      // the user to have changed there.
      const storedDescription = isExtending
        ? (predecessorSeries.description ?? '')
        : newSeriesDescription.trim() || defaultSeriesDescription;

      if (!isExtending) {
        rememberSeriesDescription(
          itemType || modality,
          storedDescription,
          rememberedDescriptionCount
        );
      }

      onSave({
        reportName: storedDescription,
        dataSource,
        series: isExtending ? predecessorSeries.value : null,
        seriesNumber: storedSeriesNumber,
        // Kept for callers that compute the new series number as
        // `1 + priorSeriesNumber`, including when it has been edited here.
        priorSeriesNumber: storedSeriesNumber - 1,
      });
      hide();
    },
    [
      isExtending,
      predecessorSeries,
      seriesNumber,
      newSeriesDescription,
      defaultSeriesDescription,
      itemType,
      modality,
      rememberedDescriptionCount,
      hide,
      onSave,
    ]
  );

  const handleSave = useCallback(() => submit(selectedDataSource), [submit, selectedDataSource]);
  const handleDownload = useCallback(() => submit('download'), [submit]);

  const handleDescriptionKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      const highlighted =
        highlightedDescription >= 0
          ? shownDescriptions[highlightedDescription]
          : descriptionCompletions[0];

      switch (event.key) {
        case 'Tab':
          // Completes what has been typed, and only moves on when there is
          // nothing left to complete.
          if (!event.shiftKey && highlighted && highlighted !== newSeriesDescription) {
            event.preventDefault();
            acceptDescription(highlighted);
          } else {
            setDescriptionsOpen(false);
          }
          break;
        case 'ArrowDown':
          event.preventDefault();
          setDescriptionsOpen(true);
          setHighlightedDescription(index => Math.min(index + 1, shownDescriptions.length - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedDescription(index => Math.max(index - 1, -1));
          break;
        case 'Escape':
          if (descriptionsOpen) {
            event.preventDefault();
            setDescriptionsOpen(false);
            setHighlightedDescription(-1);
          }
          break;
        case 'Enter':
          event.preventDefault();
          if (descriptionsOpen && highlightedDescription >= 0 && highlighted) {
            acceptDescription(highlighted);
          } else {
            handleSave();
          }
          break;
        default:
          break;
      }
    },
    [
      descriptionCompletions,
      shownDescriptions,
      descriptionsOpen,
      highlightedDescription,
      newSeriesDescription,
      acceptDescription,
      handleSave,
    ]
  );

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
    <div className="text-foreground flex min-w-[420px] max-w-md flex-col gap-4">
      {showDataSourceSelect && (
        <div>
          <Label className="mb-1 block pl-1 text-base">Data source</Label>
          <Select
            value={selectedDataSource}
            onValueChange={setSelectedDataSource}
          >
            <SelectTrigger data-cy="report-data-source-select">
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

      <div
        className="border-input bg-muted/30 rounded-md border p-3"
        data-cy="report-destination"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isExtending ? (
              <Icons.Info className="h-5 w-5 shrink-0" />
            ) : (
              <Icons.Add className="h-5 w-5 shrink-0" />
            )}
            <span
              className="text-base font-semibold"
              data-cy="report-destination-title"
            >
              {isExtending ? 'Extend Existing' : 'New Series'}
            </span>
          </div>
          {/* Only offered when there is a series to extend - data that has
              never been stored can only be saved as a new series. */}
          {predecessorSeries && (
            <TooltipProvider>
              <Tooltip open={switchTooltipOpen}>
                <TooltipTrigger asChild>
                  {/* Outlined rather than ghost, so that it reads as something
                      to click rather than as another label on the panel. */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 pl-1.5"
                    dataCY={isExtending ? 'report-use-new-series' : 'report-extend-existing'}
                    onMouseEnter={() => setSwitchTooltipOpen(true)}
                    onMouseLeave={() => setSwitchTooltipOpen(false)}
                    onClick={() => setExtendExisting(!isExtending)}
                  >
                    <Icons.ArrowRight className="h-4 w-4 shrink-0" />
                    {isExtending ? 'New Series' : 'Extend Existing'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isExtending
                    ? 'Save to a new series'
                    : 'Extend an existing series with this update'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <p className="text-muted-foreground mt-1 text-sm">
          {isExtending
            ? `Stores a new ${modality} object into the existing series below, and it becomes the one loaded by default.  The data already in the series is kept unchanged, but is no longer the default.`
            : `Creates a new ${modality} series, so nothing already stored changes.`}
        </p>

        <div className="mt-3 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Label
              htmlFor="report-series-number"
              className="text-muted-foreground w-32 shrink-0 text-sm"
            >
              Series number
            </Label>
            {isExtending ? (
              <span
                className="text-base"
                data-cy="report-series-number"
              >
                {predecessorSeries.seriesNumberLabel}
              </span>
            ) : (
              <Input
                id="report-series-number"
                data-cy="report-series-number"
                type="number"
                className="w-28"
                value={newSeriesNumber}
                onChange={event => setNewSeriesNumber(event.target.value)}
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            <Label
              htmlFor="dialog-input"
              className="text-muted-foreground w-32 shrink-0 text-sm"
            >
              Series description
            </Label>
            {isExtending ? (
              <span
                className="break-words text-base"
                data-cy="report-series-description"
              >
                {predecessorSeries.description ?? 'No description'}
              </span>
            ) : (
              <div className="relative flex flex-1 items-center gap-1">
                <InputDialog
                  value={newSeriesDescription}
                  onChange={handleDescriptionChange}
                  className="flex-1"
                >
                  <InputDialog.Field className="mb-0">
                    <InputDialog.Input
                      placeholder="Series description"
                      autoComplete="off"
                      onKeyDown={handleDescriptionKeyDown}
                      onBlur={() => setDescriptionsOpen(false)}
                    />
                  </InputDialog.Field>
                </InputDialog>
                {descriptionOptions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    dataCY="report-series-description-options"
                    aria-label="Series descriptions used before"
                    // Keeps the focus in the input, so that opening the list
                    // does not blur it shut again, and so that the arrow keys
                    // keep working afterwards.
                    onMouseDown={event => event.preventDefault()}
                    onClick={() => {
                      setHighlightedDescription(-1);
                      setDescriptionsFiltered(false);
                      setDescriptionsOpen(open => !open);
                    }}
                  >
                    <Icons.ChevronOpen className="h-5 w-5" />
                  </Button>
                )}
                {descriptionsOpen && shownDescriptions.length > 0 && (
                  <ul
                    className="bg-popover text-popover-foreground border-input absolute left-0 right-0 top-full z-50 mt-1 max-h-40 overflow-auto rounded border p-1 shadow-md"
                    data-cy="report-series-description-list"
                  >
                    {shownDescriptions.map((description, index) => (
                      <li key={description}>
                        <button
                          type="button"
                          className={cn(
                            'hover:bg-accent hover:text-accent-foreground w-full truncate rounded px-2 py-1 text-left text-base',
                            index === highlightedDescription && 'bg-accent text-accent-foreground'
                          )}
                          // Keeps the focus in the input, so that the list is
                          // not closed by the blur before the click lands.
                          onMouseDown={event => event.preventDefault()}
                          onClick={() => acceptDescription(description)}
                        >
                          {description}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
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
  );
}

export { ReportDialog };
export default {
  'ohif.createReportDialog': ReportDialog,
};
