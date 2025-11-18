import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import moment from 'moment';

import { useAppConfig } from '@state';
import { preserveQueryParameters } from '../../utils/preserveQueryParameters';

import {
  StudyListTable,
  StudyListLayout,
  StudyListProvider,
  useStudyList,
  useStudyListState,
  defaultColumns,
  PatientSummary,
  PreviewPanelShell,
  PreviewPanelEmpty,
  Thumbnail,
  TooltipProvider,
  Icons,
  Button,
  useModal,
  SettingsPopover,
  SeriesListView,
  ToggleGroup,
  ToggleGroupItem,
} from '@ohif/ui-next';

import { Types as coreTypes, utils, DicomMetadataStore, useSystem } from '@ohif/core';
import type { StudyRow as UISLRow } from '@ohif/ui-next';
import type { WorkflowId } from '@ohif/ui-next';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

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

function formatStudyDateDisplay(date?: string, time?: string) {
  const mDate = date && moment(date, ['YYYYMMDD', 'YYYY.MM.DD'], true);
  const mTime = time && moment(time, ['HH', 'HHmm', 'HHmmss', 'HHmmss.SSS'], true);
  if (mDate && mDate.isValid()) {
    const d = mDate.format('DD-MMM-YYYY');
    const t = mTime && mTime.isValid() ? mTime.format('HH:mm') : '';
    return t ? `${d} ${t}` : d;
  }
  return '';
}

function buildStudyDateSortKey(date?: string, time?: string) {
  const mDate = date && moment(date, ['YYYYMMDD', 'YYYY.MM.DD'], true);
  const mTime = time && moment(time, ['HH', 'HHmm', 'HHmmss', 'HHmmss.SSS'], true);
  if (mDate && mDate.isValid()) {
    const md = mDate.clone();
    if (mTime && mTime.isValid()) {
      md.set({
        hour: mTime.hour(),
        minute: mTime.minute(),
        second: mTime.second(),
        millisecond: mTime.millisecond(),
      });
    }
    return md.toDate().getTime();
  }
  return 0;
}

function toUIRow(study: any, workflows: WorkflowId[]): UISLRow & {
  studyInstanceUid?: string;
  studyDateTimestamp?: number;
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
    studyDateTime: formatStudyDateDisplay(date, time),
    studyDateTimestamp: buildStudyDateSortKey(date, time),
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

export default function StudyListNext2({
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

  const rows: (UISLRow & { studyInstanceUid?: string; studyDateTimestamp?: number; _rawStudy?: any })[] = React.useMemo(() => {
    const loadedModes = appConfig?.loadedModes ?? [];
    return (Array.isArray(data) ? data : []).map(study => {
      const workflows = computeWorkflowsForStudy(loadedModes, study);
      return toUIRow(study, workflows);
    });
  }, [data, appConfig?.loadedModes]);

  // URL rehydration is handled by StudyListNext2Entry before DataSourceWrapper mounts

  const handleLaunch = React.useCallback(
    (row: UISLRow & { studyInstanceUid?: string; _rawStudy?: any }, wf: WorkflowId | string) => {
      const loadedModes: any[] = appConfig?.loadedModes ?? [];
      const { uiNotificationService } = servicesManager.services as any;

      if (!row?.studyInstanceUid) {
        uiNotificationService?.show?.({
          title: 'Cannot launch viewer',
          message: 'Selected study has no StudyInstanceUID. Launch is unavailable.',
          type: 'warning',
        });
        return;
      }

      const resolveRoute = (label: string): string | null => {
        const mapped = WORKFLOW_TO_ROUTE[label as WorkflowId];
        if (mapped) return mapped;
        const byName = loadedModes.find(m => String(m.displayName).toLowerCase() === String(label).toLowerCase());
        if (byName) return byName.routeName;
        return null;
      };

      const available = computeWorkflowsForStudy(loadedModes, row?._rawStudy ?? row);

      let targetRoute = resolveRoute(String(wf));
      if (!targetRoute) {
        const first = available[0];
        targetRoute = first ? resolveRoute(String(first)) : null;
      }
      if (!targetRoute) targetRoute = 'viewer';

      let mode = loadedModes.find(m => m.routeName === targetRoute);
      if (!mode && targetRoute === 'viewer') {
        mode = loadedModes.find(m => m.routeName === 'basic') ?? null;
      }
      if (!mode) {
        uiNotificationService?.show?.({
          title: 'Cannot launch viewer',
          message: `No mode found for workflow "${String(wf)}".`,
          type: 'warning',
        });
        return;
      }

      const modalitiesToCheck = String(row?.modalities ?? '').replaceAll('/', '\\');
      const validity = mode.isValidMode?.({ modalities: modalitiesToCheck, study: row?._rawStudy });
      if (validity?.valid === false || validity?.valid === null) {
        const first = available.find(l => !!resolveRoute(String(l)));
        if (first) {
          const r = resolveRoute(String(first));
          mode = loadedModes.find(m => m.routeName === r) ?? mode;
        } else {
          return;
        }
      }

      const query = new URLSearchParams();
      query.append('StudyInstanceUIDs', row.studyInstanceUid);
      preserveQueryParameters(query);
      try {
        navigate(`${mode.routeName}${dataPath || ''}?${query.toString()}`);
      } catch (e: any) {
        uiNotificationService?.show?.({
          title: 'Navigation error',
          message: e?.message || 'Unexpected navigation error.',
          type: 'error',
        });
      }
    },
    [appConfig?.loadedModes, dataPath, navigate, servicesManager?.services]
  );

  const state = useStudyListState<UISLRow, WorkflowId>(rows as UISLRow[], { onLaunch: handleLaunch });

  const previewDefaultSize = React.useMemo(() => {
    if (typeof window !== 'undefined' && window.innerWidth > 0) {
      const percent = (325 / window.innerWidth) * 100;
      return Math.min(Math.max(percent, 15), 50);
    }
    return 30;
  }, []);

  const dateSortedColumns = React.useMemo(() => {
    const cols = defaultColumns();
    return cols.map(col =>
      col.accessorKey === 'studyDateTime'
        ? {
            ...col,
            // Display already handled by value; sort by our timestamp
            sortingFn: (a: any, b: any) => {
              const av = (a.original?.studyDateTimestamp as number) || 0;
              const bv = (b.original?.studyDateTimestamp as number) || 0;
              return av - bv;
            },
          }
        : col
    );
  }, []);

  return (
    <div className="flex h-screen min-h-0 flex-col bg-black overflow-hidden">
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex flex-1 min-h-0 flex-col">
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
                        columns={dateSortedColumns as any}
                        data={rows as UISLRow[]}
                        initialSorting={[{ id: 'studyDateTime', desc: true }]}
                        enforceSingleSelection
                        showColumnVisibility
                        title={'Study List'}
                        isPanelOpen={state.isPanelOpen}
                        onOpenPanel={() => state.setPanelOpen(true)}
                        onSelectionChange={sel => state.setSelected((sel as UISLRow[])[0] ?? null)}
                        toolbarLeft={<Icons.OHIFLogoHorizontal aria-label="OHIF logo" className="h-[22px] w-[232px]" />}
                        renderOpenPanelButton={() => <ClosedPanelControls />}
                      />
                    </div>
                  </div>
                </div>
              </StudyListLayout.Table>
              <StudyListLayout.Preview defaultSizePercent={previewDefaultSize}>
                <SidePanelPreview dataSource={dataSource} extensionManager={extensionManager as any} />
              </StudyListLayout.Preview>
            </StudyListLayout>
          </StudyListProvider>
        </div>
      </div>
    </div>
  );
}

function ClosedPanelControls() {
  const { defaultWorkflow, setDefaultWorkflow } = useStudyList<UISLRow, WorkflowId>();
  const { t } = useTranslation();
  const { servicesManager } = useSystem();
  const { customizationService } = servicesManager.services as any;
  const { show } = useModal();

  return (
    <div className="relative -top-px flex items-center gap-1">
      <SettingsPopover>
        <SettingsPopover.Trigger>
          <Button variant="ghost" size="icon" aria-label="Open settings">
            <Icons.SettingsStudyList aria-hidden="true" className="h-4 w-4" />
          </Button>
        </SettingsPopover.Trigger>
        <SettingsPopover.Content>
          <SettingsPopover.Workflow
            defaultMode={defaultWorkflow}
            onDefaultModeChange={setDefaultWorkflow}
          />
          <SettingsPopover.Divider />
          <SettingsPopover.Link
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
          </SettingsPopover.Link>
          <SettingsPopover.Link
            onClick={() => {
              const UserPreferencesModal = customizationService.getCustomization('ohif.userPreferencesModal');
              show({
                content: UserPreferencesModal,
                title: UserPreferencesModal?.title ?? t('UserPreferencesModal:User preferences'),
                containerClassName:
                  UserPreferencesModal?.containerClassName ?? 'flex max-w-4xl p-6 flex-col',
              });
            }}
          >
            User Preferences
          </SettingsPopover.Link>
        </SettingsPopover.Content>
      </SettingsPopover>

      <StudyListLayout.OpenPreviewButton />
    </div>
  );
}

function SidePanelPreview({ dataSource, extensionManager }: { dataSource: any; extensionManager: any }) {
  const { selected, setPanelOpen, defaultWorkflow, setDefaultWorkflow, launch, seriesViewMode, setSeriesViewMode } = useStudyList<UISLRow, WorkflowId>();
  const { t } = useTranslation();
  const { servicesManager } = useSystem();
  const { customizationService } = servicesManager.services as any;
  const { show } = useModal();
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
        await dataSource.retrieve.series.metadata({ StudyInstanceUID: sid });

        const nextThumbs: Record<string, string | null> = {};
        for (const s of series) {
          const seriesUID = s.seriesInstanceUid || s.SeriesInstanceUID;
          if (!seriesUID) continue;
          // Skip rendering thumbnails for non-image modalities (e.g., RTDOSE/RTPLAN/RTSTRUCT)
          const modality = String(s.modality || s.Modality || '').toUpperCase();
          if (NON_IMAGE_MODALITIES.has(modality)) {
            nextThumbs[seriesUID] = null;
            continue;
          }
          const seriesMeta = DicomMetadataStore.getSeries?.(sid, seriesUID);
          let instance = seriesMeta?.instances?.[Math.floor((seriesMeta?.instances?.length || 1) / 2)];
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
        <div className="absolute right-2 top-4 z-10 mt-1 mr-3 flex items-center gap-1">
          <SettingsPopover>
            <SettingsPopover.Trigger>
              <Button variant="ghost" size="icon" aria-label="Open settings">
                <Icons.SettingsStudyList aria-hidden="true" className="h-4 w-4" />
              </Button>
            </SettingsPopover.Trigger>
            <SettingsPopover.Content>
              <SettingsPopover.Workflow
                defaultMode={defaultWorkflow}
                onDefaultModeChange={setDefaultWorkflow}
              />
              <SettingsPopover.Divider />
              <SettingsPopover.Link
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
              </SettingsPopover.Link>
              <SettingsPopover.Link
                onClick={() => {
                  const UserPreferencesModal = customizationService.getCustomization('ohif.userPreferencesModal');
                  show({
                    content: UserPreferencesModal,
                    title: UserPreferencesModal?.title ?? t('UserPreferencesModal:User preferences'),
                    containerClassName:
                      UserPreferencesModal?.containerClassName ?? 'flex max-w-4xl p-6 flex-col',
                  });
                }}
              >
                User Preferences
              </SettingsPopover.Link>
            </SettingsPopover.Content>
          </SettingsPopover>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close preview panel"
            onClick={() => setPanelOpen(false)}
          >
            <Icons.PanelRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>
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
              <div className="h-5 w-full px-2 flex items-center justify-between gap-1 text-muted-foreground text-base">
                <span className="leading-tight">{series?.length ? ((selected as UISLRow)?.description || 'No Description') : 'No Series'}</span>
                <ToggleGroup
                  type="single"
                  value={seriesViewMode}
                  onValueChange={(value) => value && setSeriesViewMode(value as 'thumbnails' | 'list')}
                >
                  <ToggleGroupItem value="thumbnails" aria-label="Thumbnail view" className="text-actions-primary">
                    <Icons.ThumbnailView />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="list" aria-label="List view" className="text-actions-primary">
                    <Icons.ListView />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              {seriesViewMode === 'thumbnails' ? (
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
              ) : (
                <SeriesListView series={series} />
              )}
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
