import React, { type ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable, useDataTable } from '../../DataTable';
import type { DataTableProps } from '../../DataTable/DataTable';
import { Button } from '../../Button';
import { DatePickerWithRange } from '../../DateRange';
import { InputMultiSelect } from '../../InputMultiSelect';
import type { StudyDateRangeFilter, StudyRow } from '../types/types';
import { tokenizeModalities } from '../utils/tokenizeModalities';
import { useWorkflows, type Workflow } from './WorkflowsProvider';
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
  /**
   * Replaces the built-in double-click action (launch the default workflow,
   * falling back to the first applicable one). The row is selected before this
   * is called. `workflows` are the workflows applicable to the study, in menu
   * order; `defaultWorkflow` is the user's default when it applies to the study.
   */
  onStudyDoubleClick?: (
    study: StudyRow,
    context: { defaultWorkflow?: Workflow; workflows: Workflow[] }
  ) => void;
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
  onStudyDoubleClick,
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
        onStudyDoubleClick={onStudyDoubleClick}
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
  onStudyDoubleClick,
}: {
  title?: ReactNode;
  showColumnVisibility?: boolean;
  tableClassName?: string;
  toolbarLeftComponent?: ReactNode;
  toolbarRightActionsComponent?: ReactNode;
  toolbarRightComponent?: ReactNode;
  isLoading?: boolean;
  loadingComponent?: ReactNode;
  onStudyDoubleClick?: TableProps['onStudyDoubleClick'];
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

  return (
    <div className="flex h-full flex-col">
      {(showColumnVisibility || title) && (
        <DataTable.Toolbar>
          <div className="absolute left-0">{toolbarLeftComponent}</div>
          {title ? <DataTable.Title>{title}</DataTable.Title> : null}
          <div className="absolute right-0 flex items-center">
            {toolbarRightActionsComponent}
            {toolbarRightActionsComponent && <div className="bg-input mx-2 h-4 w-px" />}
            {/* Pagination appears to the left of the "View" button */}
            <DataTable.Pagination<StudyRow> />
            {showColumnVisibility && <DataTable.ViewOptions<StudyRow> />}
            {toolbarRightComponent}
          </div>
        </DataTable.Toolbar>
      )}
      <DataTable.Table<StudyRow> tableClassName={tableClassName}>
        <DataTable.Header<StudyRow> />
        <DataTable.FilterRow<StudyRow>
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
        />
        <DataTable.Body<StudyRow>
          emptyMessage={t('No studies available')}
          isLoading={isLoading}
          loadingComponent={loadingComponent}
          rowProps={{
            className: 'group cursor-pointer',
            onClick: row => {
              const original = row.original as StudyRow;
              const canDoubleClickLaunch =
                Boolean(onStudyDoubleClick) ||
                getWorkflowsForStudy(original).length > 0;
              // When a double click can launch, the second click must not read
              // as an unselect — clicking only ever selects. Otherwise toggle.
              if (canDoubleClickLaunch) {
                if (!row.getIsSelected()) {
                  row.toggleSelected(true);
                }
              } else {
                row.toggleSelected();
              }
            },
            onDoubleClick: row => {
              const original = row.original as StudyRow;
              const workflows = getWorkflowsForStudy(original);
              const defaultWorkflow = getDefaultWorkflowForStudy(original);
              // Ensure the row is selected before launching
              if (!row.getIsSelected()) {
                row.toggleSelected(true);
              }
              if (onStudyDoubleClick) {
                onStudyDoubleClick(original, { defaultWorkflow, workflows });
                return;
              }
              // Launch the default workflow, or fall back to the first
              // applicable one (the top entry of the row's workflow menu).
              const workflow = defaultWorkflow ?? workflows[0];
              workflow?.launchWithStudy(original);
            },
          }}
        />
      </DataTable.Table>
    </div>
  );
}
