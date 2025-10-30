import React from 'react';
import { ThemeWrapper } from '../../src/components/ThemeWrapper';
import { ScrollArea } from '../../src/components/ScrollArea';
import data from './patient-studies.json';
import { StudyListTable } from './study-list-table';
import { studyListColumns } from './columns';
import type { StudyRow } from './types';
import { PanelDefault } from './panels/panel-default';
import { PanelContent } from './panels/panel-content';
import { Button } from '../../src/components/Button';
import iconLeftBase from './assets/icon-left-base.svg';
import settingsIcon from './assets/settings.svg';
import { StudylistLayout } from './components/studylist-layout';
import { StudylistSettingsDialog, useDefaultWorkflow } from './components/studylist-settings';
import type { WorkflowId } from '../../StudyList/WorkflowsInfer';

export function App() {
  const [selected, setSelected] = React.useState<StudyRow | null>(null);
  const [isPanelOpen, setIsPanelOpen] = React.useState(true);

  // Default Workflow with persistence (DS-typed)
  const [defaultMode, setDefaultMode] = useDefaultWorkflow();

  const previewDefaultSize = React.useMemo(() => {
    if (typeof window !== 'undefined' && window.innerWidth > 0) {
      const percent = (325 / window.innerWidth) * 100;
      return Math.min(Math.max(percent, 15), 50);
    }
    return 30;
  }, []);

  const launchWorkflow = React.useCallback((study: StudyRow, workflow: WorkflowId) => {
    // Prototype: log the intent. Replace with navigation as needed.
    try {
      // eslint-disable-next-line no-console
      console.log('Launch workflow:', workflow, { study });
    } catch {}
  }, []);

  return (
    <ThemeWrapper>
      <div className="h-screen w-screen overflow-hidden bg-black">
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
                  <StudyListTable
                    columns={studyListColumns}
                    data={data as StudyRow[]}
                    getRowId={(row) => row.accession}
                    enforceSingleSelection={true}
                    showColumnVisibility={true}
                    title="Study List"
                    isPanelOpen={isPanelOpen}
                    onOpenPanel={() => setIsPanelOpen(true)}
                    onSelectionChange={(rows) => setSelected(rows[0] ?? null)}
                    defaultMode={defaultMode}
                    onLaunch={launchWorkflow}
                  />
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
      </div>
    </ThemeWrapper>
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
      {/* Header utility buttons */}
      <div className="absolute right-2 top-4 z-10 mt-1 mr-3 flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open settings"
          onClick={() => setIsSettingsOpen(true)}
        >
          <img src={settingsIcon} alt="" className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Close preview panel" onClick={onClose}>
          <img src={iconLeftBase} alt="" className="h-4 w-4" />
        </Button>
      </div>

      <StudylistSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        defaultMode={defaultMode}
        onDefaultModeChange={onDefaultModeChange}
      />

      <ScrollArea className="flex-1">
        <div className="px-3 pb-3" style={{ paddingTop: 'var(--panel-right-top-pad, 59px)' }}>
          {selected ? (
            <PanelContent
              key={selected.accession}
              study={selected}
              defaultMode={defaultMode}
              onDefaultModeChange={(v) => onDefaultModeChange(v as WorkflowId | null)}
            />
          ) : (
            <PanelDefault
              defaultMode={defaultMode}
              onDefaultModeChange={(v) => onDefaultModeChange(v as WorkflowId | null)}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
