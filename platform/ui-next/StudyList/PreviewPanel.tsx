import * as React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Thumbnail } from '../src/components/Thumbnail';
import { TooltipProvider } from '../src/components/Tooltip';
import type { StudyRow } from './StudyListTypes';
import type { WorkflowId } from './WorkflowsInfer';
import { Summary } from '../playground/studylist/panels/panel-summary';

export function PreviewPanel({
  study,
  defaultMode,
  onDefaultModeChange,
}: {
  study: StudyRow;
  defaultMode: WorkflowId | null;
  onDefaultModeChange: (v: WorkflowId | null) => void;
}) {
  const seriesCount = React.useMemo(() => Math.floor(Math.random() * 7) + 3, []);
  const thumbnails = Array.from({ length: seriesCount }, (_, i) => ({
    id: `preview-${study.accession}-${i}`,
    description: `Series ${i + 1}`,
    seriesNumber: i + 1,
    numInstances: 1,
  }));

  return (
    <DndProvider backend={HTML5Backend}>
      <TooltipProvider delayDuration={200}>
        <div className="flex flex-col gap-3">
          <Summary.Root data={study}>
            <Summary.Patient />
            {/* Casting to any since panel-summary is prototype-only and untyped */}
            <Summary.Workflows
              defaultMode={defaultMode as any}
              onDefaultModeChange={onDefaultModeChange as any}
            />
          </Summary.Root>
          <div className="h-7 w-full px-2 flex items-center text-foreground font-semibold text-base">
            1 Study
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,_minmax(0,135px))] place-items-start gap-[4px] pr-2">
            {thumbnails.map((item) => (
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