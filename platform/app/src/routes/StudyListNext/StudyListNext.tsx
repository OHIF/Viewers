import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import moment from 'moment';

import { useAppConfig } from '@state';
import { preserveQueryParameters } from '../../utils/preserveQueryParameters';

import { Onboarding, InvestigationalUseDialog } from '@ohif/ui-next';

import {
  StudyListTable,
  StudyListLayout,
  StudyListProvider,
  useStudyList,
  useStudyListState,
  defaultColumns,
} from '@ohif/ui-next';
import { Button, Icons, Popover, PopoverTrigger, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@ohif/ui-next';
import { SettingsPopover } from '@ohif/ui-next';
import { PreviewPanelShell } from '@ohif/ui-next';
import { PatientSummary } from '@ohif/ui-next';
import { PreviewPanelEmpty } from '@ohif/ui-next';
import { Thumbnail } from '@ohif/ui-next';
import { Types as coreTypes, utils, DicomMetadataStore } from '@ohif/core';
import type { StudyRow as UISLRow, WorkflowId } from '@ohif/ui-next';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TooltipProvider } from '@ohif/ui-next';

type Props = withAppTypes & {
  data: any[];
  dataTotal: number;
  dataSource: any;
  isLoadingData: boolean;
  dataPath?: string;
  onRefresh: () => void;
};

const ROUTE_TO_WORKFLOW: Record<string, WorkflowId> = {
  viewer: 'Basic Viewer',
  basic: 'Basic Viewer',
  segmentation: 'Segmentation',
  tmtv: 'TMTV Workflow',
  usAnnotation: 'US Workflow',
  'dynamic-volume': 'Preclinical 4D',
  microscopy: 'Microscopy',
};

const WORKFLOW_TO_ROUTE: Record<WorkflowId, string> = {
  'Basic Viewer': 'viewer',
  Segmentation: 'segmentation',
  'TMTV Workflow': 'tmtv',
  'US Workflow': 'usAnnotation',
  'Preclinical 4D': 'dynamic-volume',
  Microscopy: 'microscopy',
};

function normalizeStudyDateTime(date?: string, time?: string) {
  const mDate = date && moment(date, ['YYYYMMDD', 'YYYY.MM.DD'], true);
  const mTime = time && moment(time, ['HH', 'HHmm', 'HHmmss', 'HHmmss.SSS'], true);
  if (mDate && mDate.isValid()) {
    const d = mDate.format('YYYY-MM-DD');
    const t = mTime && mTime.isValid() ? mTime.format('HH:mm') : '00:00';
    return `${d} ${t}`;
  }
  return '';
}

function toUIRow(study: any, workflows: WorkflowId[]): UISLRow & {
  studyInstanceUid?: string;
  _rawStudy?: any;
} {
  const {
    patientName,
    mrn,
    date,
    time,
    modalities,
    description,
    accession,
    instances,
    studyInstanceUid,
  } = study;

  return {
    patient: patientName ?? '',
    mrn: mrn ?? '',
    studyDateTime: normalizeStudyDateTime(date, time),
    modalities: modalities ?? '',
    description: description ?? '',
    accession: accession ?? '',
    instances: Number(instances ?? 0),
    workflows,
    studyInstanceUid,
    _rawStudy: study,
  } as any;
}

function computeWorkflowsForStudy(loadedModes: any[], study: any): WorkflowId[] {
  if (!Array.isArray(loadedModes)) return [];
  const modes = loadedModes
    .filter(m => !m.hide)
    .filter(m => {
      try {
        const modalitiesToCheck = String(study?.modalities ?? '').replaceAll('/', '\\');
        const res = m.isValidMode?.({ modalities: modalitiesToCheck, study });
        return res?.valid === true; // include only valid
      } catch {
        return false;
      }
    });

  const set = new Set<WorkflowId>();
  for (const m of modes) {
    const wf = ROUTE_TO_WORKFLOW[m.routeName as string];
    if (wf) set.add(wf);
  }
  return Array.from(set);
}

export default function StudyListNext({
  data,
  dataTotal,
  dataSource,
  isLoadingData,
  dataPath,
  onRefresh,
  servicesManager,
  extensionManager,
}: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [appConfig] = useAppConfig();
  const { customizationService } = servicesManager.services;

  const rows: (UISLRow & { studyInstanceUid?: string; _rawStudy?: any })[] = React.useMemo(() => {
    const loadedModes = appConfig?.loadedModes ?? [];
    return (Array.isArray(data) ? data : []).map(study => {
      const workflows = computeWorkflowsForStudy(loadedModes, study);
      return toUIRow(study, workflows);
    });
  }, [data, appConfig?.loadedModes]);

  const handleLaunch = React.useCallback(
    (row: UISLRow & { studyInstanceUid?: string; _rawStudy?: any }, wf: WorkflowId | string) => {
      const loadedModes: any[] = appConfig?.loadedModes ?? [];

      // Helper: resolve a routeName from a workflow label (union or mode displayName)
      const resolveRoute = (label: string): string | null => {
        // Union mapping first
        const mapped = WORKFLOW_TO_ROUTE[label as WorkflowId];
        if (mapped) return mapped;
        // Try by matching mode displayName
        const byName = loadedModes.find(m => String(m.displayName).toLowerCase() === String(label).toLowerCase());
        if (byName) return byName.routeName;
        return null;
      };

      // Compute available workflows for this row based on current business logic
      const available = computeWorkflowsForStudy(loadedModes, row?._rawStudy ?? row);

      // Determine target route
      let targetRoute = resolveRoute(String(wf));
      if (!targetRoute) {
        // Fallback to first available workflow for the row
        const first = available[0];
        targetRoute = first ? resolveRoute(String(first)) : null;
      }
      if (!targetRoute) {
        // Last resort: prefer viewer/basic
        targetRoute = 'viewer';
      }

      // Handle viewer/basic alias
      let mode = loadedModes.find(m => m.routeName === targetRoute);
      if (!mode && targetRoute === 'viewer') {
        mode = loadedModes.find(m => m.routeName === 'basic') ?? null;
      }
      if (!mode) return;

      // Validate mode again for this study
      const modalitiesToCheck = String(row?.modalities ?? '').replaceAll('/', '\\');
      const validity = mode.isValidMode?.({ modalities: modalitiesToCheck, study: row?._rawStudy });
      if (validity?.valid === false || validity?.valid === null) {
        // If default is invalid, try first available
        const first = available.find(l => !!resolveRoute(String(l)));
        if (first) {
          const r = resolveRoute(String(first));
          mode = loadedModes.find(m => m.routeName === r) ?? mode;
        } else {
          return;
        }
      }

      const query = new URLSearchParams();
      if (row?.studyInstanceUid) {
        query.append('StudyInstanceUIDs', row.studyInstanceUid);
      }
      preserveQueryParameters(query);
      navigate(`${mode.routeName}${dataPath || ''}?${query.toString()}`);
    },
    [appConfig?.loadedModes, dataPath, navigate]
  );

  const AboutModal = customizationService.getCustomization(
    'ohif.aboutModal'
  ) as coreTypes.MenuComponentCustomization;
  const UserPreferencesModal = customizationService.getCustomization(
    'ohif.userPreferencesModal'
  ) as coreTypes.MenuComponentCustomization;

  const LoadingIndicatorProgress = customizationService.getCustomization(
    'ui.loadingIndicatorProgress'
  );

  const DicomUploadComponent = customizationService.getCustomization('dicomUploadComponent');
  const dataSourceConfigurationComponent = customizationService.getCustomization(
    'ohif.dataSourceConfigurationComponent'
  );

  const toolbarMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open settings" className="ml-2">
          <Icons.GearSettings />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() =>
            servicesManager.services.uiModalService.show({
              content: AboutModal,
              title: AboutModal?.title ?? t('AboutModal:About OHIF Viewer'),
              containerClassName: AboutModal?.containerClassName ?? 'max-w-md',
            })
          }
        >
          About
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() =>
            servicesManager.services.uiModalService.show({
              content: UserPreferencesModal as unknown as React.ComponentType,
              title: UserPreferencesModal?.title ?? t('UserPreferencesModal:User preferences'),
              containerClassName:
                UserPreferencesModal?.containerClassName ?? 'flex max-w-4xl p-6 flex-col',
            })
          }
        >
          Preferences
        </DropdownMenuItem>
        {DicomUploadComponent && dataSource.getConfig?.()?.dicomUploadEnabled ? (
          <DropdownMenuItem
            onSelect={() =>
              servicesManager.services.uiModalService.show({
                title: 'Upload files',
                closeButton: true,
                shouldCloseOnEsc: false,
                shouldCloseOnOverlayClick: false,
                content: () => (
                  <DicomUploadComponent
                    dataSource={dataSource}
                    onComplete={() => {
                      servicesManager.services.uiModalService.hide();
                      onRefresh();
                    }}
                    onStarted={() => {
                      servicesManager.services.uiModalService.show({
                        title: 'Upload files',
                        closeButton: false,
                        shouldCloseOnEsc: false,
                        shouldCloseOnOverlayClick: false,
                        content: () => (
                          <DicomUploadComponent dataSource={dataSource} />
                        ),
                      });
                    }}
                  />
                ),
              })
            }
          >
            Upload files
          </DropdownMenuItem>
        ) : null}
        {dataSourceConfigurationComponent ? (
          <DropdownMenuItem
            onSelect={() =>
              servicesManager.services.uiModalService.show({
                title: 'Configure Data Source',
                content: dataSourceConfigurationComponent as unknown as React.ComponentType,
              })
            }
          >
            Configure Data Source
          </DropdownMenuItem>
        ) : null}
        {appConfig?.oidc ? (
          <DropdownMenuItem
            onSelect={() =>
              navigate(`/logout?redirect_uri=${encodeURIComponent(window.location.href)}`)
            }
          >
            Logout
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const state = useStudyListState<UISLRow, WorkflowId>(rows as UISLRow[], { onLaunch: handleLaunch });

  const previewDefaultSize = React.useMemo(() => {
    if (typeof window !== 'undefined' && window.innerWidth > 0) {
      const percent = (325 / window.innerWidth) * 100;
      return Math.min(Math.max(percent, 15), 50);
    }
    return 30;
  }, []);

  return (
    <div className="flex h-screen min-h-0 flex-col bg-black overflow-hidden">
      <Onboarding />
      <InvestigationalUseDialog dialogConfiguration={appConfig?.investigationalUseDialog} />
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex flex-1 min-h-0 flex-col">
          
          {isLoadingData ? (
            appConfig?.showLoadingIndicator && LoadingIndicatorProgress ? (
              <LoadingIndicatorProgress className={'h-full w-full bg-black'} />
            ) : null
          ) : null}
          <StudyListProvider value={state}>
            <StudyListLayout
              isPanelOpen={state.isPanelOpen}
              onIsPanelOpenChange={state.setPanelOpen}
              defaultPreviewSizePercent={previewDefaultSize}
              className="h-full w-full"
            >
              <StudyListLayout.Table>
                <div className="flex h-full min-h-0 w-full flex-col px-3 pb-3 pt-0">
                  <div className="min-h-0 flex-1">
                    <div className="h-full rounded-md px-2 pb-2 pt-0">
                      <StudyListTable
                        columns={defaultColumns()}
                        data={rows as UISLRow[]}
                        enforceSingleSelection
                        showColumnVisibility
                        title={'Study List'}
                        isPanelOpen={state.isPanelOpen}
                        onOpenPanel={() => state.setPanelOpen(true)}
                        onSelectionChange={(sel) => state.setSelected((sel as UISLRow[])[0] ?? null)}
                        toolbarLeft={<Icons.OHIFLogoHorizontal aria-label="OHIF logo" className="h-[22px] w-[232px]" />}
                        toolbarRightExtras={toolbarMenu}
                        renderOpenPanelButton={() => <StudyListLayout.OpenPreviewButton />}
                      />
                    </div>
                  </div>
                </div>
              </StudyListLayout.Table>
              <StudyListLayout.Preview defaultSizePercent={previewDefaultSize}>
                <SidePanelReal dataSource={dataSource} extensionManager={extensionManager as any} />
              </StudyListLayout.Preview>
            </StudyListLayout>
          </StudyListProvider>
        </div>
      </div>
    </div>
  );
}

function SidePanelReal({ dataSource, extensionManager }: { dataSource: any; extensionManager: any }) {
  const { selected, setPanelOpen, defaultWorkflow, setDefaultWorkflow, launch } = useStudyList<UISLRow, WorkflowId>();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [series, setSeries] = React.useState<any[]>([]);
  const [thumbs, setThumbs] = React.useState<Record<string, string | null>>({});
  const { sortBySeriesDate } = utils as any;

  React.useEffect(() => {
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
        // eslint-disable-next-line no-console
        console.warn(e);
        setSeries([]);
        setThumbs({});
      }
    };
    run();
  }, [dataSource, selected]);

  React.useEffect(() => {
    const sid = (selected as any)?.studyInstanceUid;
    if (!sid || !series?.length) {
      setThumbs({});
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        // Ensure series/instances metadata is available so instances include imageId
        await dataSource.retrieve.series.metadata({ StudyInstanceUID: sid });

        const nextThumbs: Record<string, string | null> = {};
        for (const s of series) {
          const seriesUID = s.seriesInstanceUid || s.SeriesInstanceUID;
          if (!seriesUID) continue;
          // Find a representative instance; prefer mid-frame
          const seriesMeta = DicomMetadataStore.getSeries?.(sid, seriesUID);
          let instance = seriesMeta?.instances?.[Math.floor((seriesMeta?.instances?.length || 1) / 2)];
          if (!instance) {
            nextThumbs[seriesUID] = null;
            continue;
          }

          // Compute imageId
          let imageId: string | undefined;
          if (instance?.imageId) {
            imageId = instance.imageId;
          } else if (instance) {
            try {
              const ids = dataSource.getImageIdsForInstance({ instance });
              imageId = Array.isArray(ids) ? ids[Math.floor(ids.length / 2)] : ids;
            } catch {}
          }

          // Use data source helper; choose strategy based on configured thumbnailRendering
          let src: string | null = null;
          try {
            if (instance && imageId) {
              const cfg = dataSource.getConfig?.();
              const rendering = cfg?.thumbnailRendering;

              // Cornerstone-powered getImageSrc only for 'wadors'
              let opts: any = undefined;
              if (rendering === 'wadors') {
                try {
                  const utilitiesModule = extensionManager?.getModuleEntry?.(
                    '@ohif/extension-cornerstone.utilityModule.common'
                  );
                  const { cornerstone } = utilitiesModule?.exports?.getCornerstoneLibraries?.() || {};
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
                src = await getThumb(opts);
              }
            }
          } catch {}

          nextThumbs[seriesUID] = src ?? null;
        }

        if (!cancelled) setThumbs(nextThumbs);
      } catch (e) {
        if (!cancelled) setThumbs({});
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [dataSource, extensionManager, series, selected]);

  return (
    <PreviewPanelShell
      header={
        <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <div className="absolute right-2 top-4 z-10 mt-1 mr-3 flex items-center gap-1">
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open settings">
                <Icons.SettingsStudyList aria-hidden="true" className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close preview panel"
              onClick={() => setPanelOpen(false)}
            >
              <Icons.PanelRight aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
          <SettingsPopover
            open={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
            defaultMode={defaultWorkflow}
            onDefaultModeChange={setDefaultWorkflow}
          />
        </Popover>
      }
    >
      {selected ? (
        <DndProvider backend={HTML5Backend}>
          <TooltipProvider delayDuration={200}>
            <div className="flex flex-col gap-3">
              <PatientSummary data={selected}>
                <PatientSummary.Patient />
                <PatientSummary.Workflows<WorkflowId>
                  defaultMode={defaultWorkflow}
                  onDefaultModeChange={setDefaultWorkflow}
                  workflows={(selected as any)?.workflows as WorkflowId[]}
                  onLaunchWorkflow={(data, wf) => launch((data as UISLRow) ?? (selected as UISLRow), wf)}
                />
              </PatientSummary>
              <div className="h-7 w-full px-2 flex items-center text-foreground font-semibold text-base">
                {series?.length ? '1 Study' : 'No Series'}
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,_minmax(0,135px))] place-items-start gap-[4px] pr-2">
                {series?.map((s: any, i: number) => {
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
            </div>
          </TooltipProvider>
        </DndProvider>
      ) : (
        <PreviewPanelEmpty
          defaultMode={defaultWorkflow}
          onDefaultModeChange={setDefaultWorkflow}
        />
      )}
    </PreviewPanelShell>
  );
}
