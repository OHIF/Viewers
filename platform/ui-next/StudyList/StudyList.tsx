import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { ScrollArea } from '../src/components/ScrollArea';
import { Button } from '../src/components/Button';
import settingsIcon from '../playground/studylist/assets/settings.svg';
import iconLeftBase from '../playground/studylist/assets/icon-left-base.svg';
import ohifLogo from '../playground/studylist/assets/ohif-logo.svg';

import type { StudyRow } from './StudyListTypes';
import { StudyListColumns } from './StudyListColumns';
import { StudyListTable } from './StudyListTable';
import { PreviewPanel } from './PreviewPanel';
import { EmptyPanel } from './EmptyPanel';
import { SettingsDialog } from './SettingsDialog';
import { useDefaultWorkflow } from './useDefaultWorkflow';
import { StudylistLayout } from '../playground/studylist/components/studylist-layout';
import { ALL_WORKFLOW_OPTIONS, type WorkflowId } from './WorkflowsInfer';
import { StudyListTableProvider } from './TableContext';

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

export function StudyList({
  data,
  columns = StudyListColumns,
  title = 'Study List',
  getRowId = (row) => row.accession,
  enforceSingleSelection = true,
  showColumnVisibility = true,
  tableClassName,
  onLaunch,
}: Props) {
  const [selected, setSelected] = React.useState<StudyRow | null>(null);
  const [isPanelOpen, setIsPanelOpen] = React.useState(true);
  const [defaultMode, setDefaultMode] = useDefaultWorkflow<WorkflowId>(
    'studylist.defaultWorkflow',
    ALL_WORKFLOW_OPTIONS
  );

  const previewDefaultSize = React.useMemo(() => {
    if (typeof window !== 'undefined' && window.innerWidth > 0) {
      const percent = (325 / window.innerWidth) * 100;
      return Math.min(Math.max(percent, 15), 50);
    }
    return 30;
  }, []);

  const launchWorkflow = React.useCallback(
    (study: StudyRow, workflow: WorkflowId) => {
      onLaunch?.(study, workflow);
      try {
        // eslint-disable-next-line no-console
        console.log('Launch workflow:', workflow, { study });
      } catch {}
    },
    [onLaunch]
  );

  const toolbarLeft = (
    <img src={ohifLogo} alt="OHIF Logo" width={232} height={22} className="h-[22px] w-[232px]" />
  );

  return (
    <StudylistLayout.Root
      isPanelOpen={isPanelOpen}
      onIsPanelOpenChange={setIsPanelOpen}
      defaultPreviewSizePercent={previewDefaultSize}
      className="h-full w-full"
    >
      <StudylistLayout.TableArea>
        <div className="flex h-full w-full flex-col px-3 pb-3 pt-0">
          <div className="min-h-0 flex-1">
            <div className="bg-background h-full rounded-md px-2 pb-2 pt-0">
              <StudyListTableProvider value={{ defaultMode: defaultMode ?? null, onLaunch: launchWorkflow }}>
                <StudyListTable
                  columns={columns}
                  data={data}
                  getRowId={getRowId}
                  enforceSingleSelection={enforceSingleSelection}
                  showColumnVisibility={showColumnVisibility}
                  title={title}
                  isPanelOpen={isPanelOpen}
                  onOpenPanel={() => setIsPanelOpen(true)}
                  onSelectionChange={(rows) => setSelected(rows[0] ?? null)}
                  tableClassName={tableClassName}
                  toolbarLeft={toolbarLeft}
                  renderOpenPanelButton={({ onOpenPanel }) => (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Open preview panel"
                      onClick={onOpenPanel}
                    >
                      <img src={iconLeftBase} alt="" className="h-4 w-4" />
                    </Button>
                  )}
                />
              </StudyListTableProvider>
            </div>
          </div>
        </div>
      </StudylistLayout.TableArea>

      <StudylistLayout.PreviewArea>
        <SidePanel
          selected={selected}
          onClose={() => setIsPanelOpen(false)}
          defaultMode={defaultMode}
          onDefaultModeChange={setDefaultMode}
        />
      </StudylistLayout.PreviewArea>
    </StudylistLayout.Root>
  );
}

function SidePanel({
  selected,
  onClose,
  defaultMode,
  onDefaultModeChange,
}: {
  selected: StudyRow | null;
  onClose: () => void;
  defaultMode: WorkflowId | null;
  onDefaultModeChange: (v: WorkflowId | null) => void;
}) {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  return (
    <div className="bg-background relative flex h-full w-full flex-col">
      <div className="absolute right-2 top-4 z-10 mt-1 mr-3 flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Open settings" onClick={() => setIsSettingsOpen(true)}>
          <img src={settingsIcon} alt="" className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Close preview panel" onClick={onClose}>
          <img src={iconLeftBase} alt="" className="h-4 w-4" />
        </Button>
      </div>

      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        defaultMode={defaultMode}
        onDefaultModeChange={onDefaultModeChange}
      />

      <ScrollArea className="flex-1">
        <div className="px-3 pb-3" style={{ paddingTop: 'var(--panel-right-top-pad, 59px)' }}>
          {selected ? (
            <PreviewPanel
              key={selected.accession}
              study={selected}
              defaultMode={defaultMode}
              onDefaultModeChange={onDefaultModeChange}
            />
          ) : (
            <EmptyPanel defaultMode={defaultMode} onDefaultModeChange={onDefaultModeChange} />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}