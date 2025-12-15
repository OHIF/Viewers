import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppConfig } from '@state';
import { preserveQueryParameters } from '../../utils/preserveQueryParameters';
import { useStudyListStateSync } from '../../hooks';

import { StudyList, Icons, Button, useModal } from '@ohif/ui-next';

import { utils, DicomMetadataStore, useSystem } from '@ohif/core';
import type { StudyRow } from '@ohif/ui-next';

type Props = withAppTypes & {
  data: any[];
  dataTotal: number;
  dataSource: any;
  isLoadingData: boolean;
  dataPath?: string;
  onRefresh: () => void;
};

// Modalities that should not attempt pixel-based thumbnail rendering
const NON_IMAGE_MODALITIES = new Set(['RTDOSE', 'RTPLAN', 'RTSTRUCT']);

export default function WorkListUINext({
  data,
  dataSource,
  isLoadingData,
  dataPath,
  onRefresh,
  servicesManager,
  extensionManager,
}: Props) {
  const [appConfig] = useAppConfig();

  // Sync table state (sorting, pagination, filters) with URL and sessionStorage
  const { sorting, pagination, filters, setSorting, setPagination, setFilters } =
    useStudyListStateSync();

  // Default sorting if no URL state exists
  const defaultSorting = useMemo(() => [{ id: 'studyDateTime', desc: true }], []);

  const [selected, setSelected] = useState<StudyRow | null>(null);
  const [isPreviewOpen, setPreviewOpen] = useState(true);

  const columns = useMemo(() => StudyList.defaultColumns(), []);

  const previewDefaultSize = useMemo(() => {
    if (typeof window !== 'undefined' && window.innerWidth > 0) {
      const percent = (325 / window.innerWidth) * 100;
      return Math.min(Math.max(percent, 15), 50);
    }
    return 30;
  }, []);

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-black">
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex min-h-0 flex-1 flex-col">
          <StudyList
            loadedModes={appConfig?.loadedModes ?? []}
            preserveQueryParameters={preserveQueryParameters}
            dataPath={dataPath}
            isPreviewOpen={isPreviewOpen}
            onIsPreviewOpenChange={setPreviewOpen}
            defaultPreviewSizePercent={previewDefaultSize}
            className="h-full w-full"
          >
            <StudyList.Table
              columns={columns}
              data={data as StudyRow[]}
              sorting={sorting.length > 0 ? sorting : defaultSorting}
              pagination={pagination}
              filters={filters}
              onSortingChange={setSorting}
              onPaginationChange={setPagination}
              onFiltersChange={setFilters}
              enforceSingleSelection
              showColumnVisibility
              title={'Study List'}
              onSelectionChange={sel => setSelected((sel as StudyRow[])[0] ?? null)}
              toolbarLeftComponent={
                <Icons.OHIFLogoHorizontal
                  aria-label="OHIF logo"
                  className="h-[22px] w-[232px]"
                />
              }
              toolbarRightComponent={
                !isPreviewOpen ? (
                  <div className="relative -top-px mt-1 ml-2 flex items-center gap-1">
                    <StudyListSettingsPopover />
                    <StudyList.OpenPreviewButton />
                  </div>
                ) : undefined
              }
            />
            <StudyList.Preview>
              <SidePanelPreview
                dataSource={dataSource}
                extensionManager={extensionManager as any}
                selected={selected}
              />
            </StudyList.Preview>
          </StudyList>
        </div>
      </div>
    </div>
  );
}

function StudyListSettingsPopover() {
  // SettingsPopover.Workflow now uses useStudyListWorkflows internally
  const { t } = useTranslation();
  const { servicesManager } = useSystem();
  const { customizationService } = servicesManager.services as any;
  const { show } = useModal();

  return (
    <StudyList.SettingsPopover>
      <StudyList.SettingsPopover.Trigger>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open settings"
        >
          <Icons.SettingsStudyList
            aria-hidden="true"
            className="h-4 w-4"
          />
        </Button>
      </StudyList.SettingsPopover.Trigger>
      <StudyList.SettingsPopover.Content>
        <StudyList.SettingsPopover.Workflow />
        <StudyList.SettingsPopover.Divider />
        <StudyList.SettingsPopover.Item
          onClick={() => {
            const AboutModal = customizationService.getCustomization('ohif.aboutModal');
            show({
              content: AboutModal,
              title: AboutModal?.title ?? t('AboutModal:About OHIF Viewer'),
              containerClassName: AboutModal?.containerClassName ?? 'max-w-md',
            });
          }}
        >
          About OHIF Viewer
        </StudyList.SettingsPopover.Item>
        <StudyList.SettingsPopover.Item
          onClick={() => {
            const UserPreferencesModal = customizationService.getCustomization(
              'ohif.userPreferencesModal'
            );
            show({
              content: UserPreferencesModal,
              title: UserPreferencesModal?.title ?? t('UserPreferencesModal:User preferences'),
              containerClassName:
                UserPreferencesModal?.containerClassName ?? 'flex max-w-4xl p-6 flex-col',
            });
          }}
        >
          User Preferences
        </StudyList.SettingsPopover.Item>
      </StudyList.SettingsPopover.Content>
    </StudyList.SettingsPopover>
  );
}

function SidePanelPreview({
  dataSource,
  extensionManager,
  selected,
}: {
  dataSource: any;
  extensionManager: any;
  selected: StudyRow | null;
}) {
  const [series, setSeries] = useState<any[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string | null>>({});
  const { sortBySeriesDate } = utils as any;

  useEffect(() => {
    const run = async () => {
      const sid = (selected as any)?.studyInstanceUid;
      if (!sid) {
        setSeries([]);
        setThumbs({});
        return;
      }
      try {
        const s = await dataSource.query.series.search(sid);
        const sorted = typeof sortBySeriesDate === 'function' ? sortBySeriesDate(s) : s;
        setSeries(sorted ?? []);
      } catch (e) {
        console.warn(e);
        setSeries([]);
        setThumbs({});
      }
    };
    run();
  }, [dataSource, selected]);

  useEffect(() => {
    const sid = (selected as any)?.studyInstanceUid;
    if (!sid || !series?.length) {
      setThumbs({});
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        await dataSource.retrieve.series.metadata({ StudyInstanceUID: sid });

        const nextThumbs: Record<string, string | null> = {};
        for (const s of series) {
          const seriesUID = s.seriesInstanceUid || s.SeriesInstanceUID;
          if (!seriesUID) {
            continue;
          }
          // Skip rendering thumbnails for non-image modalities (e.g., RTDOSE/RTPLAN/RTSTRUCT)
          const modality = String(s.modality || s.Modality || '').toUpperCase();
          if (NON_IMAGE_MODALITIES.has(modality)) {
            nextThumbs[seriesUID] = null;
            continue;
          }
          const seriesMeta = DicomMetadataStore.getSeries?.(sid, seriesUID);
          const instance =
            seriesMeta?.instances?.[Math.floor((seriesMeta?.instances?.length || 1) / 2)];
          if (!instance) {
            nextThumbs[seriesUID] = null;
            continue;
          }

          let imageId: string | undefined;
          if (instance?.imageId) {
            imageId = instance.imageId;
          } else if (instance) {
            try {
              const ids = dataSource.getImageIdsForInstance({ instance });
              imageId = Array.isArray(ids) ? ids[Math.floor(ids.length / 2)] : ids;
            } catch {}
          }

          let src: string | null = null;
          try {
            if (instance && imageId) {
              const cfg = dataSource.getConfig?.();
              const rendering = cfg?.thumbnailRendering;

              let opts: any = undefined;
              if (rendering === 'wadors') {
                try {
                  const utilitiesModule = extensionManager?.getModuleEntry?.(
                    '@ohif/extension-cornerstone.utilityModule.common'
                  );
                  const { cornerstone } =
                    utilitiesModule?.exports?.getCornerstoneLibraries?.() || {};
                  if (cornerstone?.utilities?.loadImageToCanvas) {
                    const getImageSrc = (imageId: string) =>
                      new Promise<string>((resolve, reject) => {
                        try {
                          const canvas = document.createElement('canvas');
                          cornerstone.utilities
                            .loadImageToCanvas({ canvas, imageId, thumbnail: true })
                            .then(() => resolve(canvas.toDataURL()))
                            .catch(reject);
                        } catch (e) {
                          reject(e);
                        }
                      });
                    opts = { getImageSrc };
                  }
                } catch {}
              }

              const getThumb = dataSource.retrieve.getGetThumbnailSrc(instance, imageId);
              if (typeof getThumb === 'function') {
                try {
                  src = await getThumb(opts);
                } catch {
                  src = null;
                }
              }
            }
          } catch {}

          nextThumbs[seriesUID] = src ?? null;
        }

        if (!cancelled) {
          setThumbs(nextThumbs);
        }
      } catch (e) {
        if (!cancelled) {
          setThumbs({});
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [dataSource, extensionManager, series, selected]);

  return (
    <StudyList.PreviewContainer>
      <StudyList.PreviewHeader>
        <StudyListSettingsPopover />
        <StudyList.ClosePreviewButton />
      </StudyList.PreviewHeader>
      <StudyList.PreviewContent
        study={selected as StudyRow | null}
        series={series}
        thumbs={thumbs}
      />
    </StudyList.PreviewContainer>
  );
}
