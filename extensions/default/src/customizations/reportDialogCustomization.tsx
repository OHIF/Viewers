import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  cn,
  FooterAction,
  Icons,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
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

/** A series of the stored modality that this save could be written into. */
type ExistingSeries = {
  /** Identifies the series to store into, as a predecessorImageId value. */
  value: string;
  /** Numeric series number, used to compute the next available series number. */
  seriesNumber: number;
  /** Series number as shown to the user, or a placeholder when there isn't one. */
  seriesNumberLabel: string;
  description: string | null;
  /** What the series is called in the list of series to replace. */
  label: string;
};

/**
 * Which series the save goes into:
 *   - `current` the series the data was loaded from
 *   - `new` a series created for it
 *   - `replace` another loaded series of this modality
 *
 * All three store the same object - all of the current data, as selected from
 * the service holding it.  The destination only decides which series that object
 * belongs to, and so which instance it supersedes.  Nothing is merged: storing
 * into a series that already has data neither loads that data to add to it, nor
 * leaves any of the current data out.
 */
type Destination = 'current' | 'new' | 'replace';

const DESTINATIONS: {
  value: Destination;
  label: string;
  help: string;
  /** Why the destination is not available, shown on the disabled tab. */
  unavailable: string;
}[] = [
  {
    value: 'current',
    label: 'Save to current',
    help: 'Adds a new version to this series as the new default.  Earlier versions are kept.',
    unavailable: 'This data has not been saved to a series yet',
  },
  {
    value: 'new',
    label: 'Save as new',
    help: 'Creates a separate series.',
    unavailable: '',
  },
  {
    value: 'replace',
    label: 'Replace existing',
    help: 'Choose a series to replace.  The current data becomes the default and earlier versions are kept.',
    unavailable: 'No other series of this type is loaded',
  },
];

type ReportDialogProps = {
  dataSources: DataSource[];
  modality?: string;
  /**
   * The image id the data being saved was loaded from.  When it belongs to a
   * loaded series, that series is the one `Save to current` writes into.
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
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const [selectedDataSource, setSelectedDataSource] = useState<string | null>(
    dataSources?.[0]?.value ?? null
  );
  const { displaySetService } = servicesManager.services;

  const existingSeries = useMemo((): ExistingSeries[] => {
    const displaySetsMap = displaySetService.getDisplaySetCache();
    const displaySets = Array.from(displaySetsMap.values());
    const seen = new Set<string>();

    return displaySets
      .filter(ds => ds.Modality === modality)
      .map(ds => {
        const hasSeriesNumber = isFinite(ds.SeriesNumber);
        const seriesNumberLabel = hasSeriesNumber ? `${ds.SeriesNumber}` : 'Not specified';
        return {
          value: ds.predecessorImageId || ds.SeriesInstanceUID,
          seriesNumber: hasSeriesNumber ? Number(ds.SeriesNumber) : minSeriesNumber,
          seriesNumberLabel,
          description: ds.SeriesDescription || null,
          label: ds.SeriesDescription || `Series ${seriesNumberLabel}`,
        };
      })
      .filter(series => {
        // Two display sets of one series would otherwise both be offered, and
        // the select needs unique values.
        if (!series.value || seen.has(series.value)) {
          return false;
        }
        seen.add(series.value);
        return true;
      });
  }, [displaySetService, modality, minSeriesNumber]);

  /**
   * The series the data was loaded from, which `Save to current` writes into.
   * There isn't one for data that has never been stored.
   */
  const currentSeries = useMemo(
    () => existingSeries.find(series => series.value === predecessorImageId) ?? null,
    [existingSeries, predecessorImageId]
  );

  /** The other series of this modality, which `Replace existing` chooses from. */
  const replaceableSeries = useMemo(
    () => existingSeries.filter(series => series !== currentSeries),
    [existingSeries, currentSeries]
  );

  /** The series number offered for a new series - one past the existing ones. */
  const defaultNewSeriesNumber = useMemo(
    () => 1 + Math.max(minSeriesNumber, ...existingSeries.map(series => series.seriesNumber)),
    [existingSeries, minSeriesNumber]
  );

  /**
   * The series descriptions to offer for a new series, being the one provided
   * for this data followed by the ones last used for this type of item.  The
   * most recently used one is what gets offered in the field, as it is the most
   * likely one to want again.
   */
  const descriptionOptions = useMemo(() => {
    const history = getSeriesDescriptionHistory(itemType || modality, rememberedDescriptionCount);
    const options = [defaultSeriesDescription, ...history].filter(option => !!option?.trim());

    return options.filter(
      (option, index) =>
        options.findIndex(other => other.toLowerCase() === option.toLowerCase()) === index
    );
  }, [defaultSeriesDescription, itemType, modality, rememberedDescriptionCount]);

  const [destination, setDestination] = useState<Destination>(currentSeries ? 'current' : 'new');
  const [newSeriesNumber, setNewSeriesNumber] = useState(String(defaultNewSeriesNumber));
  const [newSeriesDescription, setNewSeriesDescription] = useState(
    // The provided description is the first option, so anything after it is a
    // remembered one, and the first of those was the last one used.
    () => descriptionOptions[1] ?? defaultSeriesDescription
  );
  const [replacedSeriesValue, setReplacedSeriesValue] = useState<string | null>(null);
  const [descriptionsOpen, setDescriptionsOpen] = useState(false);
  // Typing narrows the list to what it can complete; opening the list from its
  // button shows everything on offer.
  const [descriptionsFiltered, setDescriptionsFiltered] = useState(false);
  const [highlightedDescription, setHighlightedDescription] = useState(-1);

  const replacedSeries =
    replaceableSeries.find(series => series.value === replacedSeriesValue) ?? null;

  /** The series being written into - null when a series is being created. */
  const targetSeries: ExistingSeries | null =
    destination === 'current' ? currentSeries : destination === 'replace' ? replacedSeries : null;

  /** Nothing can be produced until the series to replace has been chosen. */
  const isIncomplete = destination === 'replace' && !replacedSeries;

  const isAvailable = useCallback(
    (value: Destination) =>
      (value === 'current' && !!currentSeries) ||
      value === 'new' ||
      (value === 'replace' && replaceableSeries.length > 0),
    [currentSeries, replaceableSeries]
  );

  // An emptied or otherwise unusable series number falls back to the offered one
  // rather than storing something invalid.
  const parsedSeriesNumber = Number.parseInt(newSeriesNumber, 10);
  const seriesNumber = Number.isFinite(parsedSeriesNumber)
    ? parsedSeriesNumber
    : defaultNewSeriesNumber;

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

  const submit = useCallback(
    (dataSource: string | null) => {
      if (isIncomplete) {
        return;
      }

      actionTakenRef.current = true;
      const storedSeriesNumber = targetSeries ? targetSeries.seriesNumber : seriesNumber;
      // An existing series keeps its own description, so there is nothing for
      // the user to have changed there.
      const storedDescription = targetSeries
        ? (targetSeries.description ?? '')
        : newSeriesDescription.trim() || defaultSeriesDescription;

      if (!targetSeries) {
        rememberSeriesDescription(
          itemType || modality,
          storedDescription,
          rememberedDescriptionCount
        );
      }

      onSave({
        reportName: storedDescription,
        dataSource,
        series: targetSeries ? targetSeries.value : null,
        seriesNumber: storedSeriesNumber,
        // Kept for callers that compute the new series number as
        // `1 + priorSeriesNumber`, including when it has been edited here.
        priorSeriesNumber: storedSeriesNumber - 1,
      });
      hide();
    },
    [
      isIncomplete,
      targetSeries,
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

  const handleCancel = useCallback(() => {
    actionTakenRef.current = true;
    onCancel();
    hide();
  }, [onCancel, hide]);

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

  // The dialog focuses the first control in its content when it opens, which is
  // the destination tabs.  Put the caret in the description instead, so that a
  // new series can be named by typing straight away.
  useEffect(() => {
    if (destination !== 'new') {
      return;
    }
    const focusDescription = window.setTimeout(() => descriptionInputRef.current?.focus(), 0);
    return () => window.clearTimeout(focusDescription);
  }, [destination]);

  const selected = DESTINATIONS.find(option => option.value === destination);
  const showDataSourceSelect = dataSources?.length > 1;

  return (
    <div className="text-foreground flex min-w-[460px] max-w-lg flex-col gap-4">
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-start gap-x-4 gap-y-3">
        {showDataSourceSelect && (
          <>
            <Label className="whitespace-nowrap pt-1.5 text-base">Data source</Label>
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
          </>
        )}

        <Label className="whitespace-nowrap pt-1.5 text-base">Series</Label>
        <div>
          <Tabs
            value={destination}
            onValueChange={value => setDestination(value as Destination)}
          >
            <TabsList>
              {DESTINATIONS.map(option => (
                <TabsTrigger
                  key={option.value}
                  value={option.value}
                  data-cy={`report-destination-${option.value}`}
                  disabled={!isAvailable(option.value)}
                  title={isAvailable(option.value) ? undefined : option.unavailable}
                >
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <p
            className="text-muted-foreground mt-1.5 text-sm"
            data-cy="report-destination-help"
          >
            {selected?.help}
          </p>
        </div>

        <Label
          htmlFor={destination === 'new' ? 'dialog-input' : undefined}
          className="whitespace-nowrap pt-1.5 text-base"
        >
          Series Description
        </Label>
        {destination === 'new' ? (
          <div className="relative flex items-center gap-1">
            <Input
              ref={descriptionInputRef}
              id="dialog-input"
              data-cy="dialog-input"
              autoComplete="off"
              placeholder="Series description"
              value={newSeriesDescription}
              onChange={event => handleDescriptionChange(event.target.value)}
              onKeyDown={handleDescriptionKeyDown}
              onBlur={() => setDescriptionsOpen(false)}
            />
            {descriptionOptions.length > 1 && (
              <button
                type="button"
                data-cy="report-series-description-options"
                aria-label="Series descriptions used before"
                className="text-primary hover:bg-primary/25 shrink-0 rounded p-0.5"
                // Keeps the focus in the input, so that opening the list does
                // not blur it shut again, and so that the arrow keys keep
                // working afterwards.
                onMouseDown={event => event.preventDefault()}
                onClick={() => {
                  setHighlightedDescription(-1);
                  setDescriptionsFiltered(false);
                  setDescriptionsOpen(open => !open);
                }}
              >
                <Icons.ChevronOpen className="h-5 w-5" />
              </button>
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
                      // Keeps the focus in the input, so that the list is not
                      // closed by the blur before the click lands.
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
        ) : destination === 'replace' ? (
          <Select
            value={replacedSeriesValue ?? undefined}
            onValueChange={setReplacedSeriesValue}
          >
            <SelectTrigger data-cy="report-replaced-series-select">
              <SelectValue placeholder="Series description" />
            </SelectTrigger>
            <SelectContent>
              {replaceableSeries.map(series => (
                <SelectItem
                  key={series.value}
                  value={series.value}
                >
                  {series.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span
            className="break-words pt-1.5 text-base"
            data-cy="report-series-description"
          >
            {currentSeries?.description ?? 'No description'}
          </span>
        )}

        <Label
          htmlFor={destination === 'new' ? 'report-series-number' : undefined}
          className="whitespace-nowrap pt-1.5 text-base"
        >
          Series Number
        </Label>
        {destination === 'new' ? (
          <Input
            id="report-series-number"
            data-cy="report-series-number"
            type="number"
            className="w-28"
            value={newSeriesNumber}
            onChange={event => setNewSeriesNumber(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleSave();
              }
            }}
          />
        ) : (
          <span
            className="pt-1.5 text-base"
            data-cy="report-series-number"
          >
            {targetSeries ? targetSeries.seriesNumberLabel : ''}
          </span>
        )}
      </div>

      <FooterAction>
        {enableDownload && (
          <FooterAction.Left>
            <FooterAction.Secondary
              onClick={handleDownload}
              dataCY="report-download-button"
              disabled={isIncomplete}
            >
              {t('Download')}
            </FooterAction.Secondary>
          </FooterAction.Left>
        )}
        <FooterAction.Right>
          <FooterAction.Secondary
            onClick={handleCancel}
            dataCY="input-dialog-cancel-button"
          >
            {t('Cancel')}
          </FooterAction.Secondary>
          <FooterAction.Primary
            onClick={handleSave}
            dataCY="input-dialog-save-button"
            disabled={isIncomplete}
          >
            {selected?.label}
          </FooterAction.Primary>
        </FooterAction.Right>
      </FooterAction>
    </div>
  );
}

export { ReportDialog };
export default {
  'ohif.createReportDialog': ReportDialog,
};
