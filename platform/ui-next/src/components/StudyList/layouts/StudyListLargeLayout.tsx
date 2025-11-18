import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Icons } from '../../Icons';
import { Button } from '../../Button';
import type { StudyRow } from '../StudyListTypes';
import type { WorkflowId } from '../WorkflowsInfer';
import { StudyListTable } from '../components/StudyListTable';
import { SettingsPopover } from '../components/SettingsPopover';
import { PreviewPanelContent } from '../components/PreviewPanelContent';
import { PreviewPanelEmpty } from '../components/PreviewPanelEmpty';
import { PreviewPanelShell } from '../components/PreviewPanelShell';
import { StudyListLayout } from '../components/StudyListLayout';
import { StudyListProvider, useStudyList } from '../headless/StudyListProvider';
import { useStudyListState } from '../headless/useStudyList';
import { defaultColumns } from '../columns/defaultColumns';

type Props = {
  data: StudyRow[];
  columns?: ColumnDef<StudyRow, unknown>[];
  title?: React.ReactNode;
  getRowId?: (row: StudyRow, index: number) => string;
  enforceSingleSelection?: boolean;
  showColumnVisibility?: boolean;
  tableClassName?: string;
  onLaunch?: (study: StudyRow, workflow: WorkflowId) => void;
};

export function StudyListLargeLayout({
  data,
  columns = defaultColumns(),
  title = 'Study List',
  getRowId = (row) => row.accession,
  enforceSingleSelection = true,
  showColumnVisibility = true,
  tableClassName,
  onLaunch,
}: Props) {
  const state = useStudyListState<StudyRow, WorkflowId>(data, { onLaunch });

  const previewDefaultSize = React.useMemo(() => {
    if (typeof window !== 'undefined' && window.innerWidth > 0) {
      const percent = (325 / window.innerWidth) * 100;
      return Math.min(Math.max(percent, 15), 50);
    }
    return 30;
  }, []);

  const toolbarLeft = (
    <Icons.OHIFLogoHorizontal
      aria-label="OHIF logo"
      className="h-[22px] w-[232px]"
    />
  );

  return (
    <StudyListProvider value={state}>
      <StudyListLayout
        isPanelOpen={state.isPanelOpen}
        onIsPanelOpenChange={state.setPanelOpen}
        defaultPreviewSizePercent={previewDefaultSize}
        className="h-full w-full"
        table={
          <div className="flex h-full w-full flex-col px-3 pb-3 pt-0">
            <div className="min-h-0 flex-1">
              <div className="h-full rounded-md px-2 pb-2 pt-0">
                <StudyListTable
                  columns={columns}
                  data={data}
                  getRowId={getRowId}
                  enforceSingleSelection={enforceSingleSelection}
                  showColumnVisibility={showColumnVisibility}
                  title={title}
                  isPanelOpen={state.isPanelOpen}
                  onOpenPanel={() => state.setPanelOpen(true)}
                  onSelectionChange={(rows) => state.setSelected(rows[0] ?? null)}
                  tableClassName={tableClassName}
                  toolbarLeft={toolbarLeft}
                  renderOpenPanelButton={() => <ClosedPanelControls />}
                />
              </div>
            </div>
          </div>
        }
        preview={<SidePanel />}
      />
    </StudyListProvider>
  );
}

function ClosedPanelControls() {
  const { defaultWorkflow, setDefaultWorkflow } = useStudyList<StudyRow, WorkflowId>();

  return (
    <div className="relative -top-px flex items-center gap-1">
      <SettingsPopover>
        <SettingsPopover.Trigger>
          <Button variant="ghost" size="icon" aria-label="Open settings">
            <Icons.SettingsStudyList aria-hidden="true" className="h-4 w-4" />
          </Button>
        </SettingsPopover.Trigger>
        <SettingsPopover.Workflow
          defaultMode={defaultWorkflow}
          onDefaultModeChange={setDefaultWorkflow}
        />
        <SettingsPopover.Divider />
        <SettingsPopover.Link href="/about">About OHIF Viewer</SettingsPopover.Link>
        <SettingsPopover.Link href="/user-preferences">User Preferences</SettingsPopover.Link>
      </SettingsPopover>

      <StudyListLayout.OpenPreviewButton />
    </div>
  );
}

function SidePanel() {
  const { selected, setPanelOpen, defaultWorkflow, setDefaultWorkflow } = useStudyList<StudyRow, WorkflowId>();

  return (
    <PreviewPanelShell
      header={
        <div className="absolute right-2 top-4 z-10 mt-1 mr-3 flex items-center gap-1">
          <SettingsPopover>
            <SettingsPopover.Trigger>
              <Button variant="ghost" size="icon" aria-label="Open settings">
                <Icons.SettingsStudyList aria-hidden="true" className="h-4 w-4" />
              </Button>
            </SettingsPopover.Trigger>
            <SettingsPopover.Workflow
              defaultMode={defaultWorkflow}
              onDefaultModeChange={setDefaultWorkflow}
            />
            <SettingsPopover.Divider />
            <SettingsPopover.Link href="/about">About OHIF Viewer</SettingsPopover.Link>
            <SettingsPopover.Link href="/user-preferences">User Preferences</SettingsPopover.Link>
          </SettingsPopover>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Close preview panel"
            onClick={() => setPanelOpen(false)}
          >
            <Icons.PanelRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      {selected ? (
        <PreviewPanelContent
          key={(selected as StudyRow).accession}
          study={selected as StudyRow}
          defaultMode={defaultWorkflow}
          onDefaultModeChange={setDefaultWorkflow}
        />
      ) : (
        <PreviewPanelEmpty defaultMode={defaultWorkflow} onDefaultModeChange={setDefaultWorkflow} />
      )}
    </PreviewPanelShell>
  );
}
