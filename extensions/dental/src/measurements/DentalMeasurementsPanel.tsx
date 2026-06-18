import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { utils } from '@ohif/core';
import {
  Button,
  Badge,
  Icons,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ohif/ui-next';

import { DentalMeasurement } from './dentalMeasurement';
import {
  DentalMeasurementFilters,
  DentalMeasurementSort,
  filterDentalMeasurements,
  sortDentalMeasurements,
} from './dentalMeasurementList';
import { DentalMeasurementsService } from './DentalMeasurementsService';
import { getToothDisplayLabel, getToothIdentityById } from '../tooth/toothIdentity';
import {
  createDentalMeasurementExport,
  createDentalMeasurementExportFilename,
} from './dentalMeasurementExport';

const EMPTY_FILTERS: DentalMeasurementFilters = {
  label: '',
  toothId: '',
  unit: '',
};

type DentalMeasurementsPanelProps = {
  servicesManager: AppTypes.ServicesManager;
};

function DentalMeasurementsPanel({ servicesManager }: DentalMeasurementsPanelProps) {
  const dentalMeasurementsService = servicesManager.services
    .dentalMeasurementsService as DentalMeasurementsService;
  const [measurements, setMeasurements] = useState<DentalMeasurement[]>(() =>
    dentalMeasurementsService.getMeasurements()
  );
  const [status, setStatus] = useState(() => dentalMeasurementsService.getStatus());
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sortBy, setSortBy] = useState<DentalMeasurementSort>('createdAt');

  useEffect(() => {
    const subscription = dentalMeasurementsService.subscribe(
      dentalMeasurementsService.EVENTS.MEASUREMENTS_CHANGED,
      ({ measurements: nextMeasurements }: { measurements: DentalMeasurement[] }) => {
        setMeasurements(nextMeasurements);
      }
    );
    const statusSubscription = dentalMeasurementsService.subscribe(
      dentalMeasurementsService.EVENTS.STATUS_CHANGED,
      ({ status: nextStatus }) => setStatus(nextStatus)
    );

    return () => {
      subscription.unsubscribe();
      statusSubscription.unsubscribe();
    };
  }, [dentalMeasurementsService]);

  const options = useMemo(
    () => ({
      labels: Array.from(new Set(measurements.map(item => item.label))).sort(),
      teeth: Array.from(new Set(measurements.map(item => item.toothId))).sort(),
      units: Array.from(new Set(measurements.map(item => item.unit))).sort(),
    }),
    [measurements]
  );
  const visibleMeasurements = useMemo(
    () => sortDentalMeasurements(filterDentalMeasurements(measurements, filters), sortBy),
    [filters, measurements, sortBy]
  );

  const setFilter = (key: keyof DentalMeasurementFilters, value: string) => {
    setFilters(current => ({ ...current, [key]: value === 'all' ? '' : value }));
  };

  const displaySet = servicesManager.services.displaySetService.getActiveDisplaySets?.()?.[0];
  const instance = displaySet?.instances?.[0] || displaySet?.instance;
  const exportContext = {
    studyInstanceUID: displaySet?.StudyInstanceUID || instance?.StudyInstanceUID,
    patientId: instance?.PatientID || displaySet?.PatientID,
  };

  const handleExport = useCallback(() => {
    if (!exportContext.studyInstanceUID) {
      return;
    }

    const exportedAt = new Date();
    const payload = createDentalMeasurementExport(
      {
        studyInstanceUID: exportContext.studyInstanceUID,
        patientId: exportContext.patientId,
        exportedAt: exportedAt.toISOString(),
      },
      measurements
    );
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });

    utils.downloadBlob(blob, {
      filename: createDentalMeasurementExportFilename(
        exportContext.studyInstanceUID,
        exportedAt
      ),
    });
  }, [exportContext.patientId, exportContext.studyInstanceUID, measurements]);

  const getToothLabel = (toothId: string) => {
    const tooth = getToothIdentityById(toothId);
    return tooth ? `FDI ${getToothDisplayLabel(tooth, 'FDI')} - ${tooth.label}` : toothId;
  };

  return (
    <div
      className="flex h-full flex-col bg-background"
      data-cy="dental-measurements-panel"
    >
      <div className="border-muted space-y-2 border-b p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold">Study Measurements</div>
          <div className="flex items-center gap-1">
            {status !== 'idle' && status !== 'saved' ? (
              <Badge variant="outline">{status}</Badge>
            ) : null}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Export JSON"
              data-cy="dental-export-json"
              disabled={!exportContext.studyInstanceUID || measurements.length === 0}
              onClick={handleExport}
            >
              <Icons.Download className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={filters.label || 'all'}
            onValueChange={value => setFilter('label', value)}
          >
            <SelectTrigger
              className="h-8 text-xs"
              data-cy="dental-filter-label"
            >
              <SelectValue placeholder="Label" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All labels</SelectItem>
              {options.labels.map(label => (
                <SelectItem
                  key={label}
                  value={label}
                >
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.toothId || 'all'}
            onValueChange={value => setFilter('toothId', value)}
          >
            <SelectTrigger
              className="h-8 text-xs"
              data-cy="dental-filter-tooth"
            >
              <SelectValue placeholder="Tooth" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All teeth</SelectItem>
              {options.teeth.map(toothId => (
                <SelectItem
                  key={toothId}
                  value={toothId}
                >
                  {getToothLabel(toothId)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.unit || 'all'}
            onValueChange={value => setFilter('unit', value)}
          >
            <SelectTrigger
              className="h-8 text-xs"
              data-cy="dental-filter-unit"
            >
              <SelectValue placeholder="Unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All units</SelectItem>
              {options.units.map(unit => (
                <SelectItem
                  key={unit}
                  value={unit}
                >
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sortBy}
            onValueChange={value => setSortBy(value as DentalMeasurementSort)}
          >
            <SelectTrigger
              className="h-8 text-xs"
              data-cy="dental-sort-measurements"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Newest</SelectItem>
              <SelectItem value="label">Label</SelectItem>
              <SelectItem value="toothId">Tooth</SelectItem>
              <SelectItem value="value">Value</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-px p-2">
          {visibleMeasurements.length ? (
            visibleMeasurements.map(measurement => (
              <div
                key={measurement.annotationUID}
                className="border-muted bg-card flex min-h-[72px] items-start gap-2 rounded border p-2"
                data-cy="dental-measurement-row"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{measurement.label}</div>
                  <div className="text-primary text-lg font-semibold">
                    {measurement.value ?? '-'} {measurement.unit}
                  </div>
                  <div className="text-muted-foreground truncate text-[11px]">
                    {getToothLabel(measurement.toothId)}
                    {measurement.note ? ` | ${measurement.note}` : ''}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  title="Delete measurement"
                  data-cy="dental-delete-measurement"
                  onClick={() =>
                    dentalMeasurementsService.requestDelete(measurement.annotationUID)
                  }
                >
                  <Icons.Delete />
                </Button>
              </div>
            ))
          ) : (
            <div
              className="text-muted-foreground p-6 text-center text-sm"
              data-cy="dental-measurements-empty"
            >
              No dental measurements
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default DentalMeasurementsPanel;
