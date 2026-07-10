import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useAppConfig } from '@state';
import type { RunInput } from '@ohif/core/src/classes/CommandsManager';
import { preserveQueryParameters } from '../../utils/preserveQueryParameters';
import { useStudyListStateSync, useWorkListToolbarActions } from '../../hooks';

import {
  StudyList,
  Icons,
  InvestigationalUseDialog,
  type StudyRow,
  type OnStudyDoubleClick,
} from '@ohif/ui-next';
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
  commandsManager,
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

  // `workList.onStudyDoubleClick` is the command (or command list) run when a
  // study row is double-clicked — by default `launchDefaultMode`, which
  // launches the default workflow, falling back to the first applicable one.
  // The study and its applicable workflows are merged into the command options
  // at call time, so an override only needs to name a command and any static
  // options (e.g. a specific `workflowId`).
  const studyDoubleClickCommand = customizationService.getCustomization(
    'workList.onStudyDoubleClick'
  ) as RunInput;
  const onStudyDoubleClick = useCallback<OnStudyDoubleClick>(
    (study, { defaultWorkflow, workflows }) => {
      commandsManager.run(studyDoubleClickCommand, { study, defaultWorkflow, workflows });
    },
    [commandsManager, studyDoubleClickCommand]
  );

  const columns = useMemo(() => {
    // `workList.columns` is registered as a value (StudyList.defaultColumns) and
    // merged via customization commands, so we read the result directly.
    const customized = customizationService.getCustomization('workList.columns');
    const resolved = Array.isArray(customized) ? customized : StudyList.defaultColumns;
    // Expand data-only column specs. A `?customization=` JSONC file (or any
    // serializable source) cannot carry render functions, so an entry that has
    // an `id` but no `accessorFn`/`cell` is turned into a display-only text
    // column that reads `row[id]` — matching `StudyList.textColumn`.
    return resolved.map((col: any) =>
      col && typeof col === 'object' && col.id && !col.accessorFn && !col.cell
        ? StudyList.textColumn(col.id, col.meta?.label ?? col.id, col.meta)
        : col
    );
  }, [customizationService]);

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
                  <LoadingIndicatorProgress className="bg-background !relative" />
                ) : (
                  <div className="h-8 w-8" />
                )
              }
              title={'Study List'}
              onStudyDoubleClick={studyDoubleClickCommand ? onStudyDoubleClick : undefined}
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

