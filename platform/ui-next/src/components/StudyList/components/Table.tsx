import React, { type ReactNode, useMemo, useEffect } from 'react';
import { DataTable, useDataTable } from '../../DataTable';
import type { DataTableProps } from '../../DataTable/DataTable';
import { Button } from '../../Button';
import { InputMultiSelect } from '../../InputMultiSelect';
import type { StudyRow } from '../types/types';
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
}: {
  title?: ReactNode;
  showColumnVisibility?: boolean;
  tableClassName?: string;
  toolbarLeftComponent?: ReactNode;
  toolbarRightActionsComponent?: ReactNode;
  toolbarRightComponent?: ReactNode;
}) {
  const { table } = useDataTable<StudyRow>();
  const modalityOptions = useMemo(() => {
    const rows = (table.options?.data as StudyRow[]) ?? [];
    // Build a flat list of modality tokens across all rows.
    // tokenizeModalities uppercases and splits on whitespace/slash/comma to produce unique modality codes for filtering.
    const tokens = rows.flatMap(r => tokenizeModalities(String(r.modalities ?? '')));
    return Array.from(new Set(tokens)).sort();
  }, [table.options?.data]);
  // Access workflow provider for default workflow + launch
  const { getDefaultWorkflowForStudy } = useWorkflows();

  // Responsive column visibility based on viewport width
  useEffect(() => {
    const updateVisibility = () => {
      const width = window.innerWidth;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;

      if (isMobile) {
        // Mobile: Show only Patient, Description, Actions
        table.getColumn(COLUMN_IDS.MRN)?.toggleVisibility(false);
        table.getColumn(COLUMN_IDS.STUDY_DATE_TIME)?.toggleVisibility(false);
        table.getColumn(COLUMN_IDS.MODALITIES)?.toggleVisibility(false);
        table.getColumn(COLUMN_IDS.ACCESSION)?.toggleVisibility(false);
        table.getColumn(COLUMN_IDS.INSTANCES)?.toggleVisibility(false);
      } else if (isTablet) {
        // Tablet: Add Study Date, Modalities
        table.getColumn(COLUMN_IDS.MRN)?.toggleVisibility(false);
        table.getColumn(COLUMN_IDS.STUDY_DATE_TIME)?.toggleVisibility(true);
        table.getColumn(COLUMN_IDS.MODALITIES)?.toggleVisibility(true);
        table.getColumn(COLUMN_IDS.ACCESSION)?.toggleVisibility(false);
        table.getColumn(COLUMN_IDS.INSTANCES)?.toggleVisibility(false);
      } else {
        // Desktop: Show all
        table.getColumn(COLUMN_IDS.MRN)?.toggleVisibility(true);
        table.getColumn(COLUMN_IDS.STUDY_DATE_TIME)?.toggleVisibility(true);
        table.getColumn(COLUMN_IDS.MODALITIES)?.toggleVisibility(true);
        table.getColumn(COLUMN_IDS.ACCESSION)?.toggleVisibility(true);
        table.getColumn(COLUMN_IDS.INSTANCES)?.toggleVisibility(true);
      }
    };

    updateVisibility();
    window.addEventListener('resize', updateVisibility);
    return () => window.removeEventListener('resize', updateVisibility);
  }, [table]);

  return (
    <div className="flex h-full flex-col">
      {(showColumnVisibility || title) && (
        <DataTable.Toolbar>
          <div className="absolute left-0">{toolbarLeftComponent}</div>
          {title ? <DataTable.Title>{title}</DataTable.Title> : null}
          <div className="absolute right-0 flex items-center">
            {toolbarRightActionsComponent}
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
            if (columnId === COLUMN_IDS.MODALITIES) {
              const selected = Array.isArray(value) ? (value as string[]) : [];
              return (
                <InputMultiSelect
                  options={modalityOptions}
                  value={selected}
                  onChange={next => setValue(next)}
                >
                  <InputMultiSelect.Field>
                    <InputMultiSelect.Summary variant="single" />
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
          emptyMessage="No results."
          rowProps={{
            className: 'group cursor-pointer',
            onClick: row => {
              const original = row.original as StudyRow;
              const defaultWorkflow = getDefaultWorkflowForStudy(original);
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
