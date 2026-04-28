import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';

import {
  Button,
  cn,
  Icons,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useImageViewer,
} from '@ohif/ui-next';
import { CommandsManager, DicomMetadataStore, utils } from '@ohif/core';
import { preserveQueryParameters } from '@ohif/app';
import { useAppConfig } from '@state';
import { useTranslation } from 'react-i18next';

const { formatPN } = utils;

type StudyEnvelope = {
  modalitiesToCheck: string;
  study: Record<string, unknown>;
};

function normalizeModalitiesString(raw?: string): string {
  return (raw || '').replaceAll('/', '\\');
}

async function fetchStudyEnvelope(StudyInstanceUID: string, dataSource): Promise<StudyEnvelope | null> {
  try {
    const searchFn = dataSource?.query?.studies?.search;
    if (searchFn) {
      const rows = await searchFn({ studyInstanceUid: StudyInstanceUID });
      const row = rows?.[0];
      if (row) {
        return {
          modalitiesToCheck: normalizeModalitiesString(row.modalities),
          study: { ...row },
        };
      }
    }
  } catch (_e) {
    // Fallback to locally loaded metadata
  }

  const meta = DicomMetadataStore.getStudy(StudyInstanceUID);
  if (!meta?.series?.length) {
    return null;
  }

  const modalitySet = new Set<string>();
  let numInstances = 0;

  meta.series.forEach(series => {
    if (series?.instances?.length) {
      modalitySet.add(series.instances[0].Modality as string);
      numInstances += series.instances.length;
    }
  });

  const modalitiesStr = [...modalitySet].sort().join('/');
  const inst0 = meta.series[0].instances?.[0];
  const studyPayload = {
    studyInstanceUid: StudyInstanceUID,
    modalities: modalitiesStr,
    mrn: inst0?.PatientID,
    instances: numInstances,
    description: inst0?.StudyDescription,
    date: inst0?.StudyDate,
    time: inst0?.StudyTime,
    accession: inst0?.AccessionNumber,
    patientName: inst0?.PatientName ? formatPN(inst0.PatientName) : '',
    studyInstanceUID: StudyInstanceUID,
    StudyInstanceUID,
  };

  return {
    modalitiesToCheck: normalizeModalitiesString(modalitiesStr),
    study: studyPayload,
  };
}

function getDataSourcePathSegment(locationPathname: string, loadedModes, extensionManager): string | undefined {
  const routeNames = new Set((loadedModes || []).filter(Boolean).map(m => m.routeName).filter(Boolean));
  const segs = locationPathname.split('/').filter(Boolean);

  const modeSegmentIndex = segs.findIndex(seg => routeNames.has(seg));
  if (modeSegmentIndex === -1 || modeSegmentIndex + 1 >= segs.length) {
    return undefined;
  }

  const candidate = segs[modeSegmentIndex + 1];
  if (
    candidate &&
    !routeNames.has(candidate) &&
    extensionManager?.getDataSources?.(candidate)?.length
  ) {
    return candidate;
  }
  return undefined;
}

function usePreservedViewerSearch(locationSearch: string): string {
  return useMemo(() => {
    const next = new URLSearchParams(locationSearch);
    preserveQueryParameters(next);
    const s = next.toString();
    return s ? `?${s}` : '';
  }, [locationSearch]);
}

function ToolbarModeSelector({ commandsManager: _commandsManager, servicesManager }) {
  const extensionManager = servicesManager.services.customizationService.extensionManager;
  const { t } = useTranslation('ToolbarModeSelector');

  const location = useLocation();
  const preservedSearch = usePreservedViewerSearch(location.search);

  const [appConfig] = useAppConfig();
  const loadedModes = appConfig?.loadedModes || [];
  const groupEnabledModesFirst = appConfig?.groupEnabledModesFirst === true;

  const imageViewer = useImageViewer();
  const StudyInstanceUIDs = imageViewer?.StudyInstanceUIDs;
  const primaryUid = Array.isArray(StudyInstanceUIDs) ? StudyInstanceUIDs[0] : undefined;

  const [studyEnvelope, setStudyEnvelope] = useState(null);
  const [metadataLoadFinished, setMetadataLoadFinished] = useState(false);
  const [open, setOpen] = useState(false);

  const dataSource =
    extensionManager.getActiveDataSourceOrNull?.() ?? extensionManager.getActiveDataSource?.()?.[0];

  useEffect(() => {
    let cancelled = false;

    setMetadataLoadFinished(false);

    async function load() {
      if (!primaryUid || !dataSource) {
        setStudyEnvelope(null);
        setMetadataLoadFinished(true);
        return;
      }

      const env = await fetchStudyEnvelope(primaryUid, dataSource);

      if (!cancelled) {
        setStudyEnvelope(env);
        setMetadataLoadFinished(true);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [primaryUid, dataSource]);

  const modesForToolbar = useMemo(() => loadedModes.filter(m => !m.hide), [loadedModes]);

  const comparableModesList = useMemo(() => {
    if (!studyEnvelope || !modesForToolbar?.length) {
      return [...modesForToolbar];
    }

    const list = [...modesForToolbar];

    if (groupEnabledModesFirst && studyEnvelope) {
      list.sort((a, b) => {
        try {
          const validA = !!(
            typeof a.isValidMode === 'function' &&
            a.isValidMode.call?.(a, {
              modalities: studyEnvelope.modalitiesToCheck,
              study: studyEnvelope.study,
            })?.valid
          );
          const validB = !!(
            typeof b.isValidMode === 'function' &&
            b.isValidMode.call?.(b, {
              modalities: studyEnvelope.modalitiesToCheck,
              study: studyEnvelope.study,
            })?.valid
          );
          return Number(validB) - Number(validA);
        } catch (_e) {
          return 0;
        }
      });
    }

    return list;
  }, [groupEnabledModesFirst, modesForToolbar, studyEnvelope]);

  const buildHrefForMode = useCallback(
    routeName => {
      const dsSuffix = getDataSourcePathSegment(location.pathname, loadedModes, extensionManager);
      const pathname = `/${routeName}${dsSuffix ? `/${dsSuffix}` : ''}`;
      return { pathname, search: preservedSearch };
    },
    [extensionManager, loadedModes, location.pathname, preservedSearch]
  );

  if (modesForToolbar.length <= 1) {
    return null;
  }

  if (!primaryUid) {
    return null;
  }

  if (!studyEnvelope) {
    if (!metadataLoadFinished) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled
              className={cn(
                'inline-flex h-10 w-10 cursor-not-allowed items-center justify-center !rounded-lg',
                'opacity-40 text-foreground/80 hover:bg-muted hover:text-highlight'
              )}
              aria-label={t('Browse modes')}
              data-cy="mode-selector-trigger"
            >
              <Icons.ByName
                name="icon-list-view"
                className="text-muted-foreground h-7 w-7"
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="max-w-[260px]"
          >
            <p className="text-xs leading-snug">{t('Loading study metadata for modes…')}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return null;
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center !rounded-lg',
                open
                  ? 'bg-background text-foreground/80'
                  : 'bg-transparent text-foreground/80 hover:bg-background hover:text-highlight'
              )}
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-label={t('Browse modes')}
              data-cy="mode-selector-trigger"
            >
              <Icons.ByName
                name="icon-list-view"
                className="h-7 w-7"
              />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          sideOffset={6}
        >
          <p className="text-xs">{t('Browse modes')}</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        align="center"
        sideOffset={10}
        className={cn(
          'bg-popover/98 text-popover-foreground z-[100] flex w-[min(100vw-1.75rem,17.5rem)] max-w-none flex-col overflow-visible rounded-lg border border-border/80 p-0 shadow-xl shadow-black/10 backdrop-blur-md dark:border-border/55 dark:bg-popover dark:shadow-black/35',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
        )}
      >
        <header className="border-b border-border/40 px-2.5 py-1.5">
          <p className="text-muted-foreground text-xs">{t('Modes')}</p>
        </header>

        <ul
          role="menu"
          className="space-y-0.5 px-1.5 py-1.5"
        >
          {comparableModesList.map(mode => {
            if (!mode.isValidMode) {
              return null;
            }

            let validity;
            try {
              validity = mode.isValidMode.call(mode, {
                modalities: studyEnvelope.modalitiesToCheck,
                study: studyEnvelope.study,
              });
            } catch (_e) {
              validity = { valid: false, description: t('Unable to evaluate this mode') };
            }

            if (validity.valid === null) {
              return null;
            }

            const { pathname: targetPath } = buildHrefForMode(mode.routeName);
            const isCurrentRoute = location.pathname === targetPath;

            const isDisabled = validity.valid !== true || isCurrentRoute;

            const label = mode.displayName || mode.routeName;

            return (
              <li
                key={mode.routeName}
                className="list-none"
              >
                {!isDisabled ?
                  <Link
                    role="menuitem"
                    tabIndex={0}
                    data-cy={`mode-selector-${mode.routeName}`}
                    to={buildHrefForMode(mode.routeName)}
                    className={cn(
                      'group flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5',
                      'text-foreground outline-none ring-offset-background transition-colors duration-150',
                      'hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-1 active:bg-accent/90'
                    )}
                    onClick={() => setOpen(false)}
                  >
                    <span className="min-w-0 flex-1 truncate text-left text-sm leading-snug">{label}</span>
                    <Icons.ChevronRight
                      aria-hidden
                      className={cn(
                        'h-3.5 w-3.5 shrink-0 opacity-35 transition-opacity duration-150',
                        'text-muted-foreground group-hover:translate-x-px group-hover:opacity-100'
                      )}
                    />
                  </Link>
                : isCurrentRoute ?
                  <div
                    aria-current="true"
                    aria-label={`${label} — ${t('Current mode')}`}
                    className={cn(
                      'relative flex w-full cursor-default items-center justify-between gap-2 overflow-hidden rounded-lg px-2 py-1.5',
                      'border border-primary/18 bg-gradient-to-br from-accent/85 via-accent/50 to-accent/30 text-foreground',
                      'shadow-[inset_0_1px_0_rgb(255_255_255/0.12)] ring-1 ring-inset ring-border/50',
                      'dark:from-accent/35 dark:via-accent/25 dark:to-muted/55 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] dark:ring-border/35'
                    )}
                    data-cy={`mode-selector-current-${mode.routeName}`}
                  >
                    <span className="min-w-0 flex-1 truncate text-left text-sm font-medium leading-snug tracking-tight text-foreground">
                      {label}
                    </span>
                    <span
                      aria-hidden
                      className="h-3.5 w-3.5 shrink-0 self-center select-none opacity-0"
                    />
                  </div>
                : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        role="presentation"
                        className={cn(
                          'flex w-full cursor-not-allowed rounded-lg px-2 py-1.5 text-muted-foreground opacity-[0.88]'
                        )}
                        data-cy={`mode-selector-disabled-${mode.routeName}`}
                      >
                        <span className="min-w-0 flex-1 truncate text-left text-sm leading-snug">{label}</span>
                      </div>
                    </TooltipTrigger>
                    {validity.description ?
                      <TooltipContent
                        align="start"
                        side="top"
                        sideOffset={6}
                        className="z-[220] max-w-[236px]"
                      >
                        <p className="text-xs leading-snug">{validity.description}</p>
                      </TooltipContent>
                    : null}
                  </Tooltip>
                  )
                }
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

ToolbarModeSelector.propTypes = {
  commandsManager: PropTypes.instanceOf(CommandsManager),
  servicesManager: PropTypes.shape({
    services: PropTypes.shape({
      customizationService: PropTypes.object.isRequired,
    }).isRequired,
  }).isRequired,
};

export default ToolbarModeSelector;
