import React, { useMemo, useState, useCallback } from 'react';
import { useSystem } from '@ohif/core';
import {
  MeasurementTable,
  ScrollArea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  cn,
} from '@ohif/ui-next';
import {
  PanelMeasurement,
  StudyMeasurements,
  StudySummaryFromMetadata,
  AccordionGroup,
  StudyMeasurementsActions,
  MeasurementsOrAdditionalFindings,
} from '@ohif/extension-cornerstone';
import { AccordionTrigger } from '@ohif/ui-next';

export const DENTAL_TOOL_NAMES = new Set(['PALength', 'CanalAngle', 'CrownWidth', 'RootLength']);

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'PALength', label: 'PA Length' },
  { value: 'CanalAngle', label: 'Canal Angle' },
  { value: 'CrownWidth', label: 'Crown Width' },
  { value: 'RootLength', label: 'Root Length' },
] as const;

type FilterValue = (typeof FILTER_OPTIONS)[number]['value'];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'az', label: 'Name A → Z' },
  { value: 'za', label: 'Name Z → A' },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

function SortWrapper({
  items = [],
  sortOrder,
  children,
  ...rest
}: {
  items?: any[];
  sortOrder: SortValue;
  children: React.ReactElement;
  [key: string]: any;
}) {
  const sorted = useMemo(() => {
    const arr = [...items];
    switch (sortOrder) {
      case 'oldest':
        return arr.reverse();
      case 'az':
        return arr.sort((a, b) =>
          (a.label ?? a.toolName ?? '').localeCompare(b.label ?? b.toolName ?? '')
        );
      case 'za':
        return arr.sort((a, b) =>
          (b.label ?? b.toolName ?? '').localeCompare(a.label ?? a.toolName ?? '')
        );
      case 'newest':
      default:
        return arr;
    }
  }, [items, sortOrder]);

  return React.cloneElement(React.Children.only(children), { ...rest, items: sorted });
}

function ControlsBar({
  activeFilter,
  onFilterChange,
  sortOrder,
  onSortChange,
}: {
  activeFilter: FilterValue;
  onFilterChange: (v: FilterValue) => void;
  sortOrder: SortValue;
  onSortChange: (v: SortValue) => void;
}) {
  return (
    <div className="border-border bg-background/50 space-y-2 border-b px-2 py-2">
      <div className="flex flex-wrap gap-1">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onFilterChange(opt.value)}
            className={cn(
              'select-none rounded px-2 py-0.5 text-[10px] font-semibold transition-colors duration-100',
              activeFilter === opt.value
                ? 'bg-highlight text-background'
                : 'bg-input/40 text-foreground/60 hover:bg-muted hover:text-foreground'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-end gap-1.5">
        <Select value={sortOrder} onValueChange={v => onSortChange(v as SortValue)}>
          <SelectTrigger className="h-6 w-[120px] px-2 py-0 text-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value} className="text-[11px]">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function PanelDentalMeasurements(props: any) {
  const { servicesManager } = useSystem();
  const { measurementService } = servicesManager.services;

  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');
  const [sortOrder, setSortOrder] = useState<SortValue>('newest');

  const measurementFilter = useCallback(
    (measurement: any) => {
      if (!DENTAL_TOOL_NAMES.has(measurement.toolName)) return false;
      if (activeFilter !== 'all' && measurement.toolName !== activeFilter) return false;
      return true;
    },
    [activeFilter]
  );

  const EmptyComponent = () => (
    <div data-cy="dentalMeasurements-panel">
      <MeasurementTable title="Dental Measurements" isExpanded={false}>
        <MeasurementTable.Body />
      </MeasurementTable>
    </div>
  );

  const actions = {
    createSR: undefined,
    onDelete: () => {
      if (measurementService) {
        measurementService
          .getMeasurements()
          .filter(m => DENTAL_TOOL_NAMES.has(m.toolName))
          .forEach(m => measurementService.remove(m.uid));
      }
    },
  };

  const Header = (headerProps: any) => (
    <AccordionTrigger asChild={true} className="px-0">
      <div data-cy="DentalMeasurementsHeader">
        <StudySummaryFromMetadata {...headerProps} actions={actions} />
      </div>
    </AccordionTrigger>
  );

  return (
    <div className="flex h-full flex-col">
      <ControlsBar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
      />

      <ScrollArea className="flex-1">
        <div data-cy="dentalMeasurements-panel">
          <PanelMeasurement
            measurementFilter={measurementFilter}
            emptyComponent={EmptyComponent}
            sourceChildren={props.children}
          >
            <SortWrapper sortOrder={sortOrder}>
              <StudyMeasurements grouping={props.grouping}>
                <AccordionGroup.Trigger key="dentalMeasurementsHeader" asChild={true}>
                  <Header key="dentalHeadChild" />
                </AccordionGroup.Trigger>
                <MeasurementsOrAdditionalFindings
                  key="dentalMeasurementsOrAdditionalFindings"
                  measurementFilter={measurementFilter}
                  customHeader={StudyMeasurementsActions}
                  actions={actions}
                />
              </StudyMeasurements>
            </SortWrapper>
          </PanelMeasurement>
        </div>
      </ScrollArea>
    </div>
  );
}

export default PanelDentalMeasurements;
