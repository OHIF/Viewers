import React from 'react';
import { Thumbnail } from '../src/components/Thumbnail';
import { TooltipProvider } from '../src/components/Tooltip';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

export type StudyRow = {
  patient: string;
  mrn: string;
  studyDateTime: string;
  modalities: string;
  description: string;
  accession: string;
  instances: number;
};

export function PanelContent({
  study,
  layout,
}: {
  study: StudyRow;
  layout: 'right' | 'bottom';
}) {
  // Prototype eight series thumbnails; no image data provided on purpose.
  const thumbnails = Array.from({ length: 8 }, (_, i) => ({
    id: `preview-${study.accession}-${i}`,
    description: `Series ${i + 1}`,
    seriesNumber: i + 1,
    numInstances: 1,
  }));

  return (
    <DndProvider backend={HTML5Backend}>
      <TooltipProvider delayDuration={200}>
        <div className="flex flex-col gap-2">
          <div className="text-foreground mb-1 text-sm">Study Series</div>
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
