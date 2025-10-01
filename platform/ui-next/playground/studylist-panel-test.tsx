import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeWrapper } from '../src/components/ThemeWrapper';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../src/components/Resizable';
import { ScrollArea } from '../src/components/ScrollArea';
import data from './patient-studies.json';
import { PanelDefault } from './panel-default';
import { PanelContent } from './panel-content';
import { StudyListTable } from './studylist/study-list-table';
import { studyListColumns } from './studylist/columns';
import type { StudyRow } from './studylist/types';

const App = () => {
  const [layout, setLayout] = React.useState<'right' | 'bottom'>('bottom');
  const [selected, setSelected] = React.useState<StudyRow | null>(null);

  return (
    <ThemeWrapper>
      <div className="h-screen w-screen overflow-hidden bg-black">
        <ResizablePanelGroup
          direction={layout === 'right' ? 'horizontal' : 'vertical'}
          className="h-full w-full"
        >
          <ResizablePanel defaultSize={70}>
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
                    tableClassName="min-w-[1000px]"
                    onSelectionChange={(rows) => setSelected(rows[0] ?? null)}
                  />
                </div>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel
            defaultSize={30}
            minSize={15}
          >
            <SidePanel
              layout={layout}
              selected={selected}
              onToggleLayout={() => setLayout(layout === 'right' ? 'bottom' : 'right')}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </ThemeWrapper>
  );
};

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(<App />);

function SidePanel({
  layout,
  selected,
  onToggleLayout,
}: {
  layout: 'right' | 'bottom';
  selected: StudyRow | null;
  onToggleLayout: () => void;
}) {
  return (
    <div className="bg-background flex h-full w-full flex-col">
      <ScrollArea className="flex-1">
        <div
          className="px-3 pb-3"
          style={{ paddingTop: layout === 'right' ? 'var(--panel-right-top-pad, 59px)' : 0 }}
        >
          {selected ? (
            <PanelContent
              key={selected.accession}
              study={selected}
              layout={layout}
              onToggleLayout={onToggleLayout}
            />
          ) : (
            <PanelDefault
              layout={layout}
              onToggleLayout={onToggleLayout}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Columns are now defined in ./studylist/columns
