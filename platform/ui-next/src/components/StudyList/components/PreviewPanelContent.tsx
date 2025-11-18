import * as React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Thumbnail } from '../../Thumbnail';
import { TooltipProvider } from '../../Tooltip';
import type { StudyRow } from '../StudyListTypes';
import type { WorkflowId } from '../WorkflowsInfer';
import { PatientSummary } from '../../PatientSummary';
import { useStudyList } from '../headless/StudyListProvider';
import { SeriesListView } from './SeriesListView';
import { ToggleGroup, ToggleGroupItem } from '../../ToggleGroup';
import { Icons } from '../../Icons';

export function PreviewPanelContent({
  study,
  defaultMode,
  onDefaultModeChange,
}: {
  study: StudyRow;
  defaultMode: WorkflowId | null;
  onDefaultModeChange: (v: WorkflowId | null) => void;
}) {
  const { launch, availableWorkflowsFor, seriesViewMode, setSeriesViewMode } = useStudyList<StudyRow, WorkflowId>();
  const seriesCount = React.useMemo(() => Math.floor(Math.random() * 7) + 3, []);
  const seriesData = Array.from({ length: seriesCount }, (_, i) => ({
    seriesInstanceUid: `preview-${study.accession}-${i}`,
    description: `Series ${i + 1}`,
    seriesNumber: i + 1,
    numInstances: Math.floor(Math.random() * 150) + 1,
    modality: study.modalities,
  }));

  return (
    <DndProvider backend={HTML5Backend}>
      <TooltipProvider delayDuration={200}>
        <div className="flex flex-col gap-3">
          <PatientSummary data={study}>
            <PatientSummary.Patient />
            <PatientSummary.Workflows<WorkflowId>
              defaultMode={defaultMode}
              onDefaultModeChange={onDefaultModeChange}
              workflows={availableWorkflowsFor(study)}
              onLaunchWorkflow={(data, wf) => launch((data as StudyRow) ?? study, wf)}
            />
          </PatientSummary>
          <div className="h-5 w-full px-2 flex items-center justify-between gap-1 text-muted-foreground text-base">
            <span className="leading-tight">{study?.description || 'No Description'}</span>
            <ToggleGroup
              type="single"
              value={seriesViewMode}
              onValueChange={(value) => value && setSeriesViewMode(value as 'thumbnails' | 'list')}
            >
              <ToggleGroupItem value="thumbnails" aria-label="Thumbnail view" className="text-primary">
                <Icons.ThumbnailView />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view" className="text-primary">
                <Icons.ListView />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          {seriesViewMode === 'thumbnails' ? (
            <div className="grid grid-cols-[repeat(auto-fit,_minmax(0,135px))] place-items-start gap-[4px] pr-2">
              {seriesData.map((item) => (
                <Thumbnail
                  key={item.seriesInstanceUid}
                  displaySetInstanceUID={item.seriesInstanceUid}
                  description={item.description}
                  seriesNumber={item.seriesNumber}
                  numInstances={item.numInstances}
                  modality={item.modality}
                  isActive={false}
                  onClick={() => {}}
                  onDoubleClick={() => {}}
                  viewPreset="thumbnails"
                />
              ))}
            </div>
          ) : (
            <SeriesListView series={seriesData} />
          )}
        </div>
      </TooltipProvider>
    </DndProvider>
  );
}
