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
import { Button } from '../../Button';
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
          <div className="h-7 w-full px-2 flex items-center justify-between text-foreground font-semibold text-base">
            <span>1 Study</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSeriesViewMode('thumbnails')}
                className={seriesViewMode === 'thumbnails' ? 'bg-primary/20' : ''}
                aria-label="Thumbnail view"
              >
                <Icons.ThumbnailView className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSeriesViewMode('list')}
                className={seriesViewMode === 'list' ? 'bg-primary/20' : ''}
                aria-label="List view"
              >
                <Icons.ListView className="h-4 w-4" />
              </Button>
            </div>
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
