import React, { type ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable, useDataTable } from '../../DataTable';
import type { DataTableProps } from '../../DataTable/DataTable';
import { Button } from '../../Button';
import { DatePickerWithRange } from '../../DateRange';
import { InputMultiSelect } from '../../InputMultiSelect';
import type { StudyDateRangeFilter, StudyRow } from '../types/types';
import { tokenizeModalities } from '../utils/tokenizeModalities';
import { useWorkflows } from './WorkflowsProvider';
import { COLUMN_IDS } from '../columns/defaultColumns';

export type TableProps = Omit<DataTableProps<StudyRow>, 'children' | 'getRowId'> & {
  title?: ReactNode;
  showColumnVisibility?: boolean;
  tableClassName?: string;
  toolbarLeftComponent?: ReactNode;
  toolbarRightActionsComponent?: ReactNode;
  toolbarRightComponent?: ReactNode;
  isLoading?: boolean;
  loadingComponent?: ReactNode;
};

export function Table({
  columns,
  data,
  title,
  initialVisibility = {},
  sorting,
  pagination,
  filters,
  onSortingChange,
  onPaginationChange,
  onFiltersChange,
  enforceSingleSelection = true,
  showColumnVisibility = true,
  tableClassName,
  onSelectionChange,
  toolbarLeftComponent,
  toolbarRightActionsComponent,
  toolbarRightComponent,
  isLoading,
  loadingComponent,
  manualFiltering,
}: TableProps) {
  return (
    <DataTable<StudyRow>
      data={data}
      columns={columns}
      getRowId={row => row.studyInstanceUid}
      initialVisibility={initialVisibility}
      sorting={sorting}
      pagination={pagination}
      filters={filters}
      onSortingChange={onSortingChange}
      onPaginationChange={onPaginationChange}
      onFiltersChange={onFiltersChange}
      manualFiltering={manualFiltering}
      enforceSingleSelection={enforceSingleSelection}
      onSelectionChange={onSelectionChange}
    >
      <TableContent
        title={title}
        showColumnVisibility={showColumnVisibility}
        tableClassName={tableClassName}
        toolbarLeftComponent={toolbarLeftComponent}
        toolbarRightActionsComponent={toolbarRightActionsComponent}
        toolbarRightComponent={toolbarRightComponent}
        isLoading={isLoading}
        loadingComponent={loadingComponent}
      />
    </DataTable>
  );
}

function TableContent({
  title,
  showColumnVisibility,
  tableClassName,
  toolbarLeftComponent,
  toolbarRightActionsComponent,
  toolbarRightComponent,
  isLoading,
  loadingComponent,
}: {
  title?: ReactNode;
  showColumnVisibility?: boolean;
  tableClassName?: string;
  toolbarLeftComponent?: ReactNode;
  toolbarRightActionsComponent?: ReactNode;
  toolbarRightComponent?: ReactNode;
  isLoading?: boolean;
  loadingComponent?: ReactNode;
}) {
  const { t } = useTranslation('StudyList');
  const { table } = useDataTable<StudyRow>();
  const modalityOptions = useMemo(() => {
    const rows = (table.options?.data as StudyRow[]) ?? [];
    // Build a flat list of modality tokens across all rows.
    // tokenizeModalities uppercases and splits on whitespace/slash/comma to produce unique modality codes for filtering.
    const tokens = rows.flatMap(r => tokenizeModalities(String(r.modalities ?? '')));
    return Array.from(new Set(tokens)).sort();
  }, [table.options?.data]);
  // Access workflow provider for default workflow + launch
  const { getDefaultWorkflowForStudy, getWorkflowsForStudy } = useWorkflows();

  // MOB-04: below md the filter row collapses behind a "Filtros" toggle in the
  // toolbar. Orientation flips mid-session are ignored, same as MOB-02 (V3/V5).
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const isMobileLayout =
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
  const hasToolbar = Boolean(showColumnVisibility || title);
  // Without a toolbar there is no toggle, so never hide the filters then.
  const showFilterRow = !isMobileLayout || !hasToolbar || mobileFiltersOpen;

  return (
    <div className="flex h-full flex-col">
      {(showColumnVisibility || title) && (
        <DataTable.Toolbar>
          {/* MOB-02 (V2): below md the absolutely-positioned clusters overlap on
              narrow screens, so they fall back to a static flex row:
              [logo] …spacer… [actions | pagination | settings]. */}
          <div className="absolute left-0 max-md:static max-md:pl-2">{toolbarLeftComponent}</div>
          {title ? <div className="hidden md:block"><DataTable.Title>{title}</DataTable.Title></div> : null}
          <div className="absolute right-0 flex items-center max-md:static max-md:ml-auto">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileFiltersOpen(open => !open)}
              aria-expanded={mobileFiltersOpen}
            >
              Filtros
            </Button>
            {toolbarRightActionsComponent}
            {toolbarRightActionsComponent && <div className="bg-input mx-2 hidden h-4 w-px md:block" />}
            {/* Pagination appears to the left of the "View" button */}
            <DataTable.Pagination<StudyRow> />
            {/* Column visibility toggles are pointless on mobile — responsive
                columns override them anyway. */}
            {showColumnVisibility && (
              <div className="hidden md:block">
                <DataTable.ViewOptions<StudyRow> />
              </div>
            )}
            {toolbarRightComponent}
          </div>
        </DataTable.Toolbar>
      )}
      <DataTable.Table<StudyRow> tableClassName={tableClassName}>
        <DataTable.Header<StudyRow> />
        {showFilterRow && <DataTable.FilterRow<StudyRow>
          excludeColumnIds={[COLUMN_IDS.INSTANCES]}
          renderFilterCell={({ columnId, value, setValue }) => {
            if (columnId === COLUMN_IDS.ACTIONS) {
              return (
                <div className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => table.setColumnFilters([])}
                    aria-label="Reset filters"
                  >
                    Reset
                  </Button>
                </div>
              );
            }
            if (columnId === COLUMN_IDS.STUDY_DATE_TIME) {
              const dateRange =
                value && typeof value === 'object'
                  ? (value as StudyDateRangeFilter)
                  : {};
              const startDate = dateRange.startDate ?? '';
              const endDate = dateRange.endDate ?? '';

              return (
                <DatePickerWithRange
                  id={COLUMN_IDS.STUDY_DATE_TIME}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={next => {
                    const normalized = {
                      ...(next.startDate ? { startDate: next.startDate } : {}),
                      ...(next.endDate ? { endDate: next.endDate } : {}),
                    };
                    setValue(Object.keys(normalized).length > 0 ? normalized : undefined);
                  }}
                />
              );
            }
            if (columnId === COLUMN_IDS.MODALITIES) {
              const selected = Array.isArray(value) ? (value as string[]) : [];
              return (
                <InputMultiSelect
                  options={modalityOptions}
                  value={selected}
                  onChange={next => setValue(next)}
                >
                  <InputMultiSelect.Field>
                    <InputMultiSelect.Summary />
                    <InputMultiSelect.Input
                      ariaLabel="Filter Modalities"
                      placeholder=""
                    />
                  </InputMultiSelect.Field>
                  <InputMultiSelect.Content
                    fitToContent
                    maxWidth={185}
                  >
                    <InputMultiSelect.Options />
                  </InputMultiSelect.Content>
                </InputMultiSelect>
              );
            }
            // Return null/undefined to use default rendering for other columns
            return null;
          }}
        />}
        <DataTable.Body<StudyRow>
          emptyMessage={t('No studies available')}
          isLoading={isLoading}
          loadingComponent={loadingComponent}
          rowProps={{
            className: 'group cursor-pointer',
            onClick: row => {
              const original = row.original as StudyRow;
              const defaultWorkflow = getDefaultWorkflowForStudy(original);
              // MOB-02 (V3): on small touch screens a single tap launches the
              // study — double-click is undiscoverable on touch. Fresh devices
              // have no stored default workflow (localStorage is empty on the
              // email-link demo path), so fall back to the first applicable
              // workflow — the same entry the Actions menu lists first.
              if (
                typeof window !== 'undefined' &&
                window.matchMedia('(pointer: coarse) and (max-width: 767px)').matches
              ) {
                const launchWorkflow = defaultWorkflow ?? getWorkflowsForStudy(original)[0];
                if (launchWorkflow) {
                  row.toggleSelected(true);
                  launchWorkflow.launchWithStudy(original);
                  return;
                }
              }
              // When a default workflow is set, do not allow a second click to unselect.
              // Always select on click; otherwise toggle selection.
              if (defaultWorkflow) {
                if (!row.getIsSelected()) {
                  row.toggleSelected(true);
                }
              } else {
                row.toggleSelected();
              }
            },
            onDoubleClick: row => {
              const original = row.original as StudyRow;
              const defaultWorkflow = getDefaultWorkflowForStudy(original);
              if (!defaultWorkflow) {
                return;
              }
              // Ensure the row is selected, then launch with the default workflow
              if (!row.getIsSelected()) {
                row.toggleSelected(true);
              }
              defaultWorkflow.launchWithStudy(original);
            },
          }}
        />
      </DataTable.Table>
    </div>
  );
}
