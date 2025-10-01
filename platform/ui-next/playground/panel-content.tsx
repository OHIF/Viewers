import React from 'react';
import { Thumbnail } from '../src/components/Thumbnail';
import { TooltipProvider } from '../src/components/Tooltip';
import { Table, TableHeader, TableRow, TableHead } from '../src/components/Table';
import { Button } from '../src/components/Button';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { StudyRow } from './studylist/types';

export function PanelContent({
  study,
  layout,
  onToggleLayout,
}: {
  study: StudyRow;
  layout: 'right' | 'bottom';
  onToggleLayout: () => void;
}) {
  // Prototype eight series thumbnails; no image data provided on purpose.
  const seriesCount = React.useMemo(() => Math.floor(Math.random() * 7) + 3, []); // 3–9
  const thumbnails = Array.from({ length: seriesCount }, (_, i) => ({
    id: `preview-${study.accession}-${i}`,
    description: `Series ${i + 1}`,
    seriesNumber: i + 1,
    numInstances: 1,
  }));

  return (
    <DndProvider backend={HTML5Backend}>
      <TooltipProvider delayDuration={200}>
        <div className="flex flex-col gap-2">
          <Table noScroll>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-background sticky top-0 z-10 rounded-t-md">
                  <div className="flex items-center justify-between">
                    <span>Studies</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onToggleLayout}
                    >
                      {layout === 'right' ? 'Move to Bottom' : 'Move to Right'}
                    </Button>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
          </Table>
          <div className="grid grid-cols-[repeat(auto-fit,_minmax(0,135px))] place-items-start gap-[4px] pr-2">
            {thumbnails.map(item => (
              <Thumbnail
                key={item.id}
                displaySetInstanceUID={item.id}
                description={item.description}
                seriesNumber={item.seriesNumber}
                numInstances={item.numInstances}
                modality={study.modalities}
                isActive={false}
                onClick={() => {}}
                onDoubleClick={() => {}}
                viewPreset="thumbnails"
              />
            ))}
          </div>
        </div>
      </TooltipProvider>
    </DndProvider>
  );
}
