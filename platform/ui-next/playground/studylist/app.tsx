import React from 'react';
import { ThemeWrapper } from '../../src/components/ThemeWrapper';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '../../src/components/Resizable';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../src/components/Dialog';

export function App() {
  const [selected, setSelected] = React.useState<StudyRow | null>(null);
  const [isPanelOpen, setIsPanelOpen] = React.useState(true);
  const [defaultMode, setDefaultMode] = React.useState<string | null>(null);
  const previewDefaultSize = React.useMemo(() => {
    if (typeof window !== 'undefined' && window.innerWidth > 0) {
      const percent = (315 / window.innerWidth) * 100;
      return Math.min(Math.max(percent, 15), 50);
    }
    return 30;
  }, []);

  return (
    <ThemeWrapper>
      <div className="h-screen w-screen overflow-hidden bg-black">
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full w-full"
        >
          <ResizablePanel defaultSize={100 - previewDefaultSize}>
            <div className="flex h-full w-full flex-col px-3 pb-3 pt-0">
              <div className="min-h-0 flex-1">
                <div className="bg-background h-full rounded-md px-2 pb-2 pt-0">
                  <StudyListTable
                    columns={studyListColumns}
                    data={data as StudyRow[]}
                    getRowId={row => row.accession}
                    enforceSingleSelection={true}
                    showColumnVisibility={true}
                    title="Study List"
                    isPanelOpen={isPanelOpen}
                    onOpenPanel={() => setIsPanelOpen(true)}
                    onSelectionChange={rows => setSelected(rows[0] ?? null)}
                  />
                </div>
              </div>
            </div>
          </ResizablePanel>

          {isPanelOpen && (
            <>
              <ResizableHandle />
              <ResizablePanel
                defaultSize={previewDefaultSize}
                minSize={15}
              >
                <SidePanel
                  selected={selected}
                  onClose={() => setIsPanelOpen(false)}
                  defaultMode={defaultMode}
                  onDefaultModeChange={setDefaultMode}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
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
  selected: StudyRow | null
  onClose: () => void
  defaultMode: string | null
  onDefaultModeChange: (v: string | null) => void
}) {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  return (
    <div className="bg-background relative flex h-full w-full flex-col">
      <div className="absolute right-2 top-4 z-10 mt-1 mr-3 flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open settings"
          onClick={() => setIsSettingsOpen(true)}
        >
          <img
            src={settingsIcon}
            alt=""
            className="h-4 w-4"
          />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close preview panel"
          onClick={onClose}
        >
          <img
            src={iconLeftBase}
            alt=""
            className="h-4 w-4"
          />
        </Button>
      </div>
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <ScrollArea className="flex-1">
        <div
          className="px-3 pb-3"
          style={{ paddingTop: 'var(--panel-right-top-pad, 59px)' }}
        >
          {selected ? (
            <PanelContent
              key={selected.accession}
              study={selected}
              defaultMode={defaultMode}
              onDefaultModeChange={onDefaultModeChange}
            />
          ) : (
            <PanelDefault
              defaultMode={defaultMode}
              onDefaultModeChange={onDefaultModeChange}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
