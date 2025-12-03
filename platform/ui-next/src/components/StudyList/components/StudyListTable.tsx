import * as React from 'react';
import type { ColumnDef, SortingState, VisibilityState } from '@tanstack/react-table';
import { DataTable, useDataTable } from '../../DataTable';
import { Button } from '../../Button';
import { InputMultiSelect } from '../../InputMultiSelect';
import type { StudyRow } from '../types/StudyListTypes';
import { tokenizeModalities } from '../utils/tokenizeModalities';
import { useStudyListWorkflows } from './StudyListWorkflowProvider';

type Props = {
  columns: ColumnDef<StudyRow, unknown>[];
  data: StudyRow[];
  title?: React.ReactNode;
  initialSorting?: SortingState;
  initialVisibility?: VisibilityState;
  enforceSingleSelection?: boolean;
  showColumnVisibility?: boolean;
  tableClassName?: string;
  onSelectionChange?: (rows: StudyRow[]) => void;
  toolbarLeftComponent?: React.ReactNode;
  toolbarRightComponent?: React.ReactNode;
};

export function StudyListTable({
  columns,
  data,
  title,
  initialSorting = [],
  initialVisibility = {},
  enforceSingleSelection = true,
  showColumnVisibility = true,
  tableClassName,
  onSelectionChange,
  toolbarLeftComponent,
  toolbarRightComponent,
}: Props) {
  return (
    <DataTable<StudyRow>
      data={data}
      columns={columns}
      getRowId={row => row.studyInstanceUid}
      initialSorting={initialSorting}
      initialVisibility={initialVisibility}
      enforceSingleSelection={enforceSingleSelection}
      onSelectionChange={onSelectionChange}
    >
      <StudyListTableContent
        title={title}
        showColumnVisibility={showColumnVisibility}
        tableClassName={tableClassName}
        toolbarLeftComponent={toolbarLeftComponent}
        toolbarRightComponent={toolbarRightComponent}
      />
    </DataTable>
  );
}

function StudyListTableContent({
  title,
  showColumnVisibility,
  tableClassName,
  toolbarLeftComponent,
  toolbarRightComponent,
}: {
  title?: React.ReactNode;
  showColumnVisibility?: boolean;
  tableClassName?: string;
  toolbarLeftComponent?: React.ReactNode;
  toolbarRightComponent?: React.ReactNode;
}) {
  const { table } = useDataTable<StudyRow>();
  const modalityOptions = React.useMemo(() => {
    const rows = (table.options?.data as StudyRow[]) ?? [];
    // Build a flat list of modality tokens across all rows.
    // tokenizeModalities uppercases and splits on whitespace/slash/comma to produce unique modality codes for filtering.
    const tokens = rows.flatMap(r => tokenizeModalities(String(r.modalities ?? '')));
    return Array.from(new Set(tokens)).sort();
  }, [table.options?.data]);
  // Access workflow provider for default workflow + launch
  const { getDefaultWorkflowForStudy } = useStudyListWorkflows();

  // Responsive column visibility based on viewport width
  React.useEffect(() => {
    const updateVisibility = () => {
      const width = window.innerWidth;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;

      if (isMobile) {
        // Mobile: Show only Patient, Description, Actions
        table.getColumn('mrn')?.toggleVisibility(false);
        table.getColumn('studyDateTime')?.toggleVisibility(false);
        table.getColumn('modalities')?.toggleVisibility(false);
        table.getColumn('accession')?.toggleVisibility(false);
        table.getColumn('instances')?.toggleVisibility(false);
      } else if (isTablet) {
        // Tablet: Add Study Date, Modalities
        table.getColumn('mrn')?.toggleVisibility(false);
        table.getColumn('studyDateTime')?.toggleVisibility(true);
        table.getColumn('modalities')?.toggleVisibility(true);
        table.getColumn('accession')?.toggleVisibility(false);
        table.getColumn('instances')?.toggleVisibility(false);
      } else {
        // Desktop: Show all
        table.getColumn('mrn')?.toggleVisibility(true);
        table.getColumn('studyDateTime')?.toggleVisibility(true);
        table.getColumn('modalities')?.toggleVisibility(true);
        table.getColumn('accession')?.toggleVisibility(true);
        table.getColumn('instances')?.toggleVisibility(true);
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
            {/* Pagination appears to the left of the "View" button */}
            <DataTable.Pagination />
            {showColumnVisibility && <DataTable.ViewOptions<StudyRow> />}
            {toolbarRightComponent}
          </div>
        </DataTable.Toolbar>
      )}
      <DataTable.Table tableClassName={tableClassName}>
        <DataTable.Header<StudyRow> />
        <DataTable.FilterRow<StudyRow>
          excludeColumnIds={['instances']}
          renderFilterCell={({ columnId, value, setValue }) => {
            if (columnId === 'actions') {
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
            if (columnId === 'modalities') {
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
