import * as React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Thumbnail } from '../../Thumbnail';
import { TooltipProvider } from '../../Tooltip';
import type { StudyRow } from '../StudyListTypes';
import { PatientSummary } from './PatientSummary';
import { useStudyList } from '../headless/StudyListProvider';
import { SeriesListView } from './SeriesListView';
import { ToggleGroup, ToggleGroupItem } from '../../ToggleGroup';
import { Icons } from '../../Icons';

export function PreviewPanelContent({
  study,
  series = [],
  thumbs = {},
}: {
  study: StudyRow;
  series?: Array<{
    seriesInstanceUid?: string;
    SeriesInstanceUID?: string;
    description?: string;
    SeriesDescription?: string;
    seriesNumber?: number;
    SeriesNumber?: number;
    numInstances?: number;
    numSeriesInstances?: number;
    modality?: string;
    Modality?: string;
  }>;
  thumbs?: Record<string, string | null>;
}) {
  const { seriesViewMode, setSeriesViewMode } = useStudyList<StudyRow>();

  return (
    <DndProvider backend={HTML5Backend}>
      <TooltipProvider delayDuration={200}>
        <div className="flex flex-col gap-3">
          <PatientSummary data={study}>
            <PatientSummary.Patient />
            <PatientSummary.Workflows />
          </PatientSummary>
          <div className="text-muted-foreground flex h-5 w-full items-center justify-between gap-1 px-2 text-base">
            <span className="leading-tight">
              {series?.length ? study?.description || 'No Description' : 'No Series'}
            </span>
            <ToggleGroup
              type="single"
              value={seriesViewMode}
              onValueChange={value => value && setSeriesViewMode(value as 'thumbnails' | 'list')}
            >
              <ToggleGroupItem
                value="thumbnails"
                aria-label="Thumbnail view"
                className="text-primary"
              >
                <Icons.ThumbnailView />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="list"
                aria-label="List view"
                className="text-primary"
              >
                <Icons.ListView />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          {seriesViewMode === 'thumbnails' ? (
            <div className="grid grid-cols-[repeat(auto-fit,_minmax(0,135px))] place-items-start gap-[4px] pr-2">
              {series?.map((s, i) => {
                const seriesUID = s.seriesInstanceUid || s.SeriesInstanceUID || String(i);
                const imageSrc = thumbs[seriesUID] || undefined;
                return (
                  <Thumbnail
                    key={`series-${seriesUID}`}
                    displaySetInstanceUID={`series-${seriesUID}`}
                    imageSrc={imageSrc as any}
                    imageAltText={s.description || s.SeriesDescription || ''}
                    description={s.description || s.SeriesDescription || '(empty)'}
                    seriesNumber={s.seriesNumber ?? s.SeriesNumber ?? ''}
                    numInstances={s.numSeriesInstances ?? s.numInstances ?? 0}
                    modality={s.modality || s.Modality || ''}
                    isActive={false}
                    onClick={() => {}}
                    onDoubleClick={() => {}}
                    viewPreset="thumbnails"
                  />
                );
              })}
            </div>
          ) : (
            <SeriesListView series={series} />
          )}
        </div>
      </TooltipProvider>
    </DndProvider>
  );
}
