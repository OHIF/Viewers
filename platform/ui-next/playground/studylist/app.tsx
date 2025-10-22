import React from 'react'
import { ThemeWrapper } from '../../src/components/ThemeWrapper'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../../src/components/Resizable'
import { ScrollArea } from '../../src/components/ScrollArea'
import data from './patient-studies.json'
import { StudyListTable } from './study-list-table'
import { studyListColumns } from './columns'
import type { StudyRow } from './types'
import { PanelDefault } from './panels/panel-default'
import { PanelContent } from './panels/panel-content'

export function App() {
  const [selected, setSelected] = React.useState<StudyRow | null>(null)
  const previewDefaultSize = React.useMemo(() => {
    if (typeof window !== 'undefined' && window.innerWidth > 0) {
      const percent = (300 / window.innerWidth) * 100
      return Math.min(Math.max(percent, 15), 50)
    }
    return 30
  }, [])

  return (
    <ThemeWrapper>
      <div className="h-screen w-screen overflow-hidden bg-black">
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          <ResizablePanel defaultSize={100 - previewDefaultSize}>
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

          <ResizablePanel defaultSize={previewDefaultSize} minSize={15}>
            <SidePanel
              selected={selected}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </ThemeWrapper>
  )
}

function SidePanel({ selected }: { selected: StudyRow | null }) {
  return (
    <div className="bg-background flex h-full w-full flex-col">
      <ScrollArea className="flex-1">
        <div className="px-3 pb-3" style={{ paddingTop: 'var(--panel-right-top-pad, 59px)' }}>
          {selected ? (
            <PanelContent key={selected.accession} study={selected} />
          ) : (
            <PanelDefault />
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
