import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAppConfig } from '@state';
import { preserveQueryParameters } from '../../utils/preserveQueryParameters';
import { useStudyListStateSync } from '../../hooks';

import { StudyList, Icons, Button, useModal, InvestigationalUseDialog } from '@ohif/ui-next';
import { useWorkListToolbarActions } from './useWorkListToolbarActions';

import { utils, useSystem } from '@ohif/core';
import { thumbnailNoImageModalities } from '@ohif/core/src/utils/thumbnailNoImageModalities';
import {
  PreviewThumbnailStatusState,
  type PreviewThumbnailStatus,
  type StudyRow,
} from '@ohif/ui-next';

type Props = withAppTypes & {
  data: any[];
  dataTotal: number;
  dataSource: any;
  isLoadingData: boolean;
  hasFetchedOnce?: boolean;
  dataPath?: string;
  onRefresh: () => void;
};

export default function WorkListUINext({
  data,
  dataSource,
  isLoadingData,
  hasFetchedOnce = false,
  dataPath,
  onRefresh,
  servicesManager,
  extensionManager,
}: Props) {
  const [appConfig] = useAppConfig();
  const { customizationService } = servicesManager.services;
  const LoadingIndicatorProgress = customizationService.getCustomization(
    'ui.loadingIndicatorProgress'
  ) as React.ComponentType<{ className?: string }> | undefined;
  const [isFilterPending, setIsFilterPending] = useState(false);
  const showStudyListLoading = Boolean(
    (appConfig.showLoadingIndicator && isLoadingData) || !hasFetchedOnce || isFilterPending
  );

  // Sync table state (sorting, pagination, filters) with URL and sessionStorage
  const { sorting, pagination, filters, setSorting, setPagination, setFilters } =
    useStudyListStateSync();

  // Default sorting if no URL state exists
  const defaultSorting = useMemo(() => [{ id: 'studyDateTime', desc: true }], []);

  const [selected, setSelected] = useState<StudyRow | null>(null);
  const [isPreviewOpen, setPreviewOpen] = useState(true);

  const columns = useMemo(() => StudyList.defaultColumns(), []);

  const logoComponent = appConfig?.whiteLabeling?.createLogoComponentFn?.(React) ?? (
    <Icons.OHIFLogoHorizontal
      aria-label="OHIF logo"
      className="h-[22px] w-[232px]"
    />
  );

  const toolbarActions = useWorkListToolbarActions(servicesManager, dataSource, onRefresh);

  const previewDefaultSize = useMemo(() => {
    if (typeof window !== 'undefined' && window.innerWidth > 0) {
      const percent = (325 / window.innerWidth) * 100;
      return Math.min(Math.max(percent, 15), 50);
    }
    return 30;
  }, []);

  useEffect(() => {
    if (isLoadingData) {
      return;
    }
    setIsFilterPending(false);
  }, [isLoadingData, data]);

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-black">
      <InvestigationalUseDialog dialogConfiguration={appConfig?.investigationalUseDialog} />
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
              onFiltersChange={updater => {
                setIsFilterPending(true);
                setFilters(updater);
              }}
              isLoading={showStudyListLoading}
              loadingComponent={
                LoadingIndicatorProgress ? (
                  <LoadingIndicatorProgress className="!relative bg-black" />
                ) : (
                  <div className="h-8 w-8" />
                )
              }
              title={'Study List'}
              onSelectionChange={sel => setSelected((sel as StudyRow[])[0] ?? null)}
              toolbarLeftComponent={logoComponent}
              toolbarRightActionsComponent={toolbarActions}
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
                selected={selected}
                servicesManager={servicesManager}
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
  const [appConfig] = useAppConfig();
  const navigate = useNavigate();
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
        {appConfig.oidc && (
          <StudyList.SettingsPopover.Item
            onClick={() => {
              navigate(`/logout?redirect_uri=${encodeURIComponent(window.location.href)}`);
            }}
          >
            {t('Header:Logout')}
          </StudyList.SettingsPopover.Item>
        )}
      </StudyList.SettingsPopover.Content>
    </StudyList.SettingsPopover>
  );
}

type PreviewSeriesView = 'all' | 'thumbnails' | 'list';
const ALLOWED_PREVIEW_SERIES_VIEWS: ReadonlyArray<PreviewSeriesView> = [
  'all',
  'thumbnails',
  'list',
];

function SidePanelPreview({
  dataSource,
  selected,
  servicesManager,
}: {
  dataSource: any;
  selected: StudyRow | null;
  servicesManager: AppTypes.ServicesManager;
}) {
  const [series, setSeries] = useState<any[]>([]);
  const { sortBySeriesDate } = utils as any;
  const { customizationService } = servicesManager.services;
  const thumbnailRendering = dataSource?.getConfig?.()?.thumbnailRendering;
  const thumbnailRequestStrategy =
    dataSource?.getConfig?.()?.thumbnailRequestStrategy || 'bulkDataRetrieve';
  const forceListView =
    thumbnailRendering === 'wadors' ||
    thumbnailRendering === 'thumbnailDirect' ||
    thumbnailRequestStrategy === 'bulkDataRetrieve';

  const customizationSeriesView = customizationService.getCustomization(
    'workListUINext.previewSeriesView'
  );
  const configuredSeriesView: PreviewSeriesView = ALLOWED_PREVIEW_SERIES_VIEWS.includes(
    customizationSeriesView as PreviewSeriesView
  )
    ? (customizationSeriesView as PreviewSeriesView)
    : 'all';
  const seriesView: PreviewSeriesView = forceListView ? 'list' : configuredSeriesView;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const studyInstanceUID = (selected as any)?.studyInstanceUid;
      if (!studyInstanceUID) {
        setSeries([]);
        return;
      }

      try {
        const seriesList = await dataSource.query.series.search(studyInstanceUID);
        if (cancelled) {
          return;
        }

        const sortedSeriesList = sortBySeriesDate?.(seriesList) ?? [];
        const normalizedSeriesList = sortedSeriesList.map(row => {
          const modality = String(row.modality || row.Modality || '').toUpperCase();
          const thumbnailStatus: PreviewThumbnailStatus = thumbnailNoImageModalities.includes(
            modality
          )
            ? { status: PreviewThumbnailStatusState.NotApplicable }
            : { status: PreviewThumbnailStatusState.Loading };
          return {
            ...row,
            thumbnailStatus,
          };
        });

        setSeries(normalizedSeriesList);

        for (const row of normalizedSeriesList) {
          const seriesUID = row.seriesInstanceUid || row.SeriesInstanceUID;
          if (!seriesUID) {
            continue;
          }
          if (row.thumbnailStatus?.status === PreviewThumbnailStatusState.NotApplicable) {
            continue;
          }

          void (async () => {
            let src: string | null = null;
            try {
              const getThumbnailSrc = dataSource?.retrieve?.getGetThumbnailSrc?.(
                { StudyInstanceUID: studyInstanceUID, SeriesInstanceUID: seriesUID },
                undefined
              );
              src = (await getThumbnailSrc?.()) ?? null;
            } catch {
              src = null;
            }
            if (!cancelled) {
              setSeries(prev =>
                prev.map(seriesItem => {
                  const itemUID = seriesItem.seriesInstanceUid || seriesItem.SeriesInstanceUID;
                  if (itemUID !== seriesUID) {
                    return seriesItem;
                  }
                  return {
                    ...seriesItem,
                    thumbnailStatus: src
                      ? { status: PreviewThumbnailStatusState.Ready, src }
                      : { status: PreviewThumbnailStatusState.NotAvailable },
                  };
                })
              );
            }
          })();
        }
      } catch (e) {
        if (!cancelled) {
          console.warn('Failed to load preview series/thumbnails for selected study.', e);
          setSeries([]);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [dataSource, selected]);

  const handleThumbnailImageError = useCallback((seriesUID: string) => {
    setSeries(prevSeriesList =>
      prevSeriesList.map(seriesItem => {
        const seriesItemUID = seriesItem.seriesInstanceUid || seriesItem.SeriesInstanceUID;
        if (seriesItemUID !== seriesUID) {
          return seriesItem;
        }
        const thumbnailStatus = seriesItem.thumbnailStatus as PreviewThumbnailStatus | undefined;
        if (
          thumbnailStatus?.status === PreviewThumbnailStatusState.Ready &&
          thumbnailStatus.src?.startsWith('blob:')
        ) {
          try {
            URL.revokeObjectURL(thumbnailStatus.src);
          } catch {}
        }
        return {
          ...seriesItem,
          thumbnailStatus: { status: PreviewThumbnailStatusState.NotAvailable },
        };
      })
    );
  }, []);

  return (
    <StudyList.PreviewContainer>
      <StudyList.PreviewHeader>
        <StudyListSettingsPopover />
        <StudyList.ClosePreviewButton />
      </StudyList.PreviewHeader>
      <StudyList.PreviewContent
        study={selected as StudyRow | null}
        series={series}
        seriesView={seriesView}
        onThumbnailImageError={handleThumbnailImageError}
      />
    </StudyList.PreviewContainer>
  );
}
