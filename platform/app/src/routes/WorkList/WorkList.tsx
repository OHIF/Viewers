import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppConfig } from '@state';
import { preserveQueryParameters } from '../../utils/preserveQueryParameters';
import { useStudyListStateSync, useWorkListToolbarActions } from '../../hooks';

import { StudyList, InvestigationalUseDialog, type StudyRow } from '@ohif/ui-next';
import { StudyListSettingsPopover } from './StudyListSettingsPopover';
import { SidePanelPreview } from './SidePanelPreview';

type Props = withAppTypes & {
  data: any[];
  dataSource: any;
  isLoadingData: boolean;
  hasFetchedOnce?: boolean;
  dataPath?: string;
  onRefresh: () => void;
};

export default function WorkList({
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
  const { t } = useTranslation('StudyList');
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
  // MOB-02 (V3): evaluated once at mount — orientation flips mid-session are
  // intentionally ignored for v1 (no resize listener).
  const [isDesktop] = useState(
    () => typeof window === 'undefined' || window.matchMedia('(min-width: 768px)').matches
  );
  // Preview panel closed by default on mobile: open it would cover ~50% of a
  // phone screen with an empty "no study selected" pane.
  const [isPreviewOpen, setPreviewOpen] = useState(isDesktop);

  const columns = useMemo(() => {
    // `workList.columns` is registered as a value (StudyList.defaultColumns) and
    // merged via customization commands, so we read the result directly.
    const customized = customizationService.getCustomization('workList.columns');
    const baseColumns = Array.isArray(customized) ? customized : StudyList.defaultColumns;
    // MIMPS-08: localize column header labels. Column defs carry plain-English
    // `meta.label` strings; we map them through the StudyList i18n namespace so
    // headers (and the column show/hide menu, which reads the same meta) render
    // in the active language. Unknown labels fall back to their original text.
    return baseColumns.map(column =>
      column?.meta?.label
        ? { ...column, meta: { ...column.meta, label: t(column.meta.label) } }
        : column
    );
  }, [customizationService, t]);

  // MIMPS-01: fall back to the BlackVoxel wordmark (never the upstream OHIF
  // logo) when no whiteLabeling config is present.
  const logoComponent = appConfig?.whiteLabeling?.createLogoComponentFn?.(React) ?? (
    <img
      src="/blackvoxel-logo.svg"
      alt="BlackVoxel Viewer"
      className="h-[18px] w-auto md:h-[22px] md:w-[232px]"
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
    <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-black">
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
              title={t('StudyList')}
              onSelectionChange={sel => setSelected((sel as StudyRow[])[0] ?? null)}
              toolbarLeftComponent={logoComponent}
              toolbarRightActionsComponent={toolbarActions}
              toolbarRightComponent={
                !isPreviewOpen ? (
                  <div className="relative -top-px mt-1 ml-2 flex items-center gap-1">
                    <StudyListSettingsPopover />
                    {/* MOB-02 (V3): no preview panel on mobile, so no open button */}
                    {isDesktop && <StudyList.OpenPreviewButton />}
                  </div>
                ) : undefined
              }
            />
            {/* MOB-02 (V3): the preview side panel (and its resize handle) is
                desktop-only — at 390px it would consume half the screen. */}
            {isDesktop && (
              <StudyList.Preview>
                <SidePanelPreview
                  dataSource={dataSource}
                  selected={selected}
                  servicesManager={servicesManager}
                />
              </StudyList.Preview>
            )}
          </StudyList>
        </div>
      </div>
    </div>
  );
}
