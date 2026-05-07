import * as React from 'react';
import { Thumbnail } from '../../Thumbnail';
import { TooltipProvider } from '../../Tooltip';
import {
  PreviewThumbnailStatusState,
  type PreviewThumbnailStatus,
  type StudyRow,
} from '../types/types';
import { PreviewPatientSummary } from './PreviewPatientSummary';
import { PreviewSeriesList } from './PreviewSeriesList';
import { ToggleGroup, ToggleGroupItem } from '../../ToggleGroup';
import { Icons } from '../../Icons';
import { ScrollArea } from '../../ScrollArea';

type PreviewSeriesViewMode = 'thumbnails' | 'list';
type PreviewSeriesView = 'all' | PreviewSeriesViewMode;

function PreviewContent({
  study,
  series = [],
  seriesView = 'all',
  onThumbnailImageError,
}: {
  study?: StudyRow | null;
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
    thumbnailStatus?: PreviewThumbnailStatus;
  }>;
  /**
   * Controls which series views are available in the preview.
   * - `'all'` (default): toggle visible; initially shows the thumbnails.
   * - `'thumbnails'`: toggle hidden; locked to thumbnails view.
   * - `'list'`: toggle hidden; locked to list view.
   */
  seriesView?: PreviewSeriesView;
  /**
   * Called when the thumbnail src URL fails to decode in the browser (broken image).
   */
  onThumbnailImageError?: (seriesInstanceUid: string) => void;
}) {
  const isToggleVisible = seriesView === 'all';
  const [seriesViewMode, setSeriesViewMode] = React.useState<PreviewSeriesViewMode>('thumbnails');
  const effectiveSeriesViewMode: PreviewSeriesViewMode = isToggleVisible
    ? seriesViewMode
    : seriesView;
  const imagingSeries = series.filter(
    s => s.thumbnailStatus?.status !== PreviewThumbnailStatusState.NotApplicable
  );
  const nonImagingSeries = series.filter(
    s => s.thumbnailStatus?.status === PreviewThumbnailStatusState.NotApplicable
  );

  // Handle empty state when no study is provided
  if (!study) {
    return (
      <PreviewPatientSummary>
        <PreviewPatientSummary.Patient />
        <PreviewPatientSummary.Workflows />
      </PreviewPatientSummary>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-full min-h-0 w-full flex-col gap-3">
        <PreviewPatientSummary data={study}>
          <PreviewPatientSummary.Patient />
          <PreviewPatientSummary.Workflows />
        </PreviewPatientSummary>
        <div className="text-muted-foreground flex h-5 w-full items-center justify-between gap-1 px-2 text-base">
          <span className="leading-tight">
            {series?.length ? study?.description || 'No Description' : 'No Series'}
          </span>
          {isToggleVisible && (
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
          )}
        </div>
        <ScrollArea className="h-full w-full min-h-0 flex-1">
          {effectiveSeriesViewMode === 'thumbnails' ? (
            <div className="flex flex-col">
                {imagingSeries.length > 0 && (
                  <div className="grid grid-cols-[repeat(auto-fit,_minmax(0,135px))] place-items-start gap-[4px] pr-2">
                    {imagingSeries.map((seriesItem, index) => {
                      const seriesUID =
                        seriesItem.seriesInstanceUid ||
                        seriesItem.SeriesInstanceUID ||
                        String(index);
                      const thumbnailState = seriesItem.thumbnailStatus;
                      const imageSrc =
                        thumbnailState?.status === PreviewThumbnailStatusState.Ready
                          ? thumbnailState.src
                          : undefined;
                      return (
                        <Thumbnail
                          key={`series-imaging-${seriesUID}`}
                          displaySetInstanceUID={`series-${seriesUID}`}
                          imageSrc={imageSrc as any}
                          onImageLoadError={() => onThumbnailImageError?.(seriesUID)}
                          imageAltText={
                            seriesItem.description || seriesItem.SeriesDescription || ''
                          }
                          description={
                            seriesItem.description || seriesItem.SeriesDescription || '(empty)'
                          }
                          seriesNumber={seriesItem.seriesNumber ?? seriesItem.SeriesNumber ?? ''}
                          numInstances={
                            seriesItem.numSeriesInstances ?? seriesItem.numInstances ?? 0
                          }
                          modality={seriesItem.modality || seriesItem.Modality || ''}
                          isActive={false}
                          onClick={() => {}}
                          onDoubleClick={() => {}}
                          isDraggable={false}
                          viewPreset="thumbnails"
                          thumbnailType="thumbnail"
                        >
                          {thumbnailState?.status === PreviewThumbnailStatusState.NotAvailable && (
                            <div className="bg-muted/50 flex h-full w-full items-center justify-center rounded">
                              <Icons.SeriesPlaceholder className="text-muted-foreground h-[40px] w-[60px] opacity-50" />
                            </div>
                          )}
                        </Thumbnail>
                      );
                    })}
                  </div>
                )}
                {nonImagingSeries.length > 0 && (
                  <div className="mt-1 grid grid-cols-[repeat(auto-fit,_minmax(0,275px))] place-items-start gap-[2px] pr-2">
                    {nonImagingSeries.map((seriesItem, index) => {
                      const seriesUID =
                        seriesItem.seriesInstanceUid ||
                        seriesItem.SeriesInstanceUID ||
                        String(index);
                      return (
                        <Thumbnail
                          key={`series-non-imaging-${seriesUID}`}
                          displaySetInstanceUID={`series-${seriesUID}`}
                          imageAltText={
                            seriesItem.description || seriesItem.SeriesDescription || ''
                          }
                          description={
                            seriesItem.description || seriesItem.SeriesDescription || '(empty)'
                          }
                          seriesNumber={seriesItem.seriesNumber ?? seriesItem.SeriesNumber ?? ''}
                          numInstances={
                            seriesItem.numSeriesInstances ?? seriesItem.numInstances ?? 0
                          }
                          modality={seriesItem.modality || seriesItem.Modality || ''}
                          isActive={false}
                          onClick={() => {}}
                          onDoubleClick={() => {}}
                          isDraggable={false}
                          viewPreset="list"
                          thumbnailType="thumbnailNoImage"
                        />
                      );
                    })}
                  </div>
                )}
            </div>
          ) : (
            <PreviewSeriesList series={series} />
          )}
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}

export { PreviewContent };
