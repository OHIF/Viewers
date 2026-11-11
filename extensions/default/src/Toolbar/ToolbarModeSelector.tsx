import React, { useEffect, useState } from 'react';
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
import { useAppConfig } from '@state';
import { useTranslation } from 'react-i18next';

import {
  evaluateModeValidity,
  fetchStudyEnvelope,
  getDataSourcePathSegment,
  modeIsValidForOrdering,
  type StudyEnvelope,
  usePreservedViewerSearch,
  type LoadedModeRouteHint,
} from '../utils/modeSelectorUtils';

type ToolbarMenuRow = {
  mode: LoadedModeRouteHint & { displayName?: string; hide?: boolean; isValidMode?: unknown };
  validity: Exclude<ReturnType<typeof evaluateModeValidity>, undefined>;
  modeHref: { pathname: string; search: string };
  isCurrentRoute: boolean;
  isDisabled: boolean;
  label: string;
};

type ToolbarModeSelectorProps = {
  servicesManager: AppTypes.ServicesManager;
};

/** Study envelope together with the study and data source it was loaded for. */
type LoadedEnvelope = {
  primaryUid: string;
  dataSource: unknown;
  envelope: StudyEnvelope | null;
};

function ToolbarModeSelector({ servicesManager }: ToolbarModeSelectorProps) {
  const { customizationService } = servicesManager.services;
  const extensionManager = customizationService.extensionManager;
  const { t } = useTranslation('ToolbarModeSelector');

  const labels = {
    browseModes: t('Browse modes'),
    modes: t('Modes'),
    loadingMetadata: t('Loading study metadata for modes…'),
    unableToEvaluate: t('Unable to evaluate this mode'),
    currentMode: t('Current mode'),
    noModesAvailable: t('No modes available'),
  };

  const location = useLocation();
  const preservedSearch = usePreservedViewerSearch(location.search, customizationService);

  const [appConfig] = useAppConfig();
  const loadedModes = appConfig?.loadedModes || [];
  const groupEnabledModesFirst = appConfig?.groupEnabledModesFirst === true;

  const imageViewer = useImageViewer();
  const StudyInstanceUIDs = imageViewer?.StudyInstanceUIDs;
  const primaryUid = Array.isArray(StudyInstanceUIDs) ? StudyInstanceUIDs[0] : undefined;

  const [loaded, setLoaded] = useState<LoadedEnvelope | null>(null);
  const [open, setOpen] = useState(false);

  const dataSource =
    extensionManager.getActiveDataSourceOrNull?.() ?? extensionManager.getActiveDataSource?.()?.[0];

  useEffect(() => {
    if (!primaryUid || !dataSource) {
      return;
    }

    let cancelled = false;
    fetchStudyEnvelope(primaryUid, dataSource).then(envelope => {
      if (!cancelled) {
        setLoaded({ primaryUid, dataSource, envelope });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [primaryUid, dataSource]);

  /**
   * Only use an envelope loaded for the current study and data source. Until the new one arrives,
   * an envelope from the previous study must not enable or disable modes.
   */
  const isLoadedForCurrentStudy =
    !!loaded && loaded.primaryUid === primaryUid && loaded.dataSource === dataSource;
  const studyEnvelope = isLoadedForCurrentStudy ? loaded.envelope : null;
  const metadataLoadFinished = !dataSource || isLoadedForCurrentStudy;

  const modesForToolbar = loadedModes.filter(m => !m.hide);

  const comparableModesList = [...modesForToolbar];
  if (studyEnvelope && groupEnabledModesFirst) {
    comparableModesList.sort((a, b) => {
      const validA = modeIsValidForOrdering(a, studyEnvelope);
      const validB = modeIsValidForOrdering(b, studyEnvelope);
      return Number(validB) - Number(validA);
    });
  }

  const dsSuffix = getDataSourcePathSegment(location.pathname, loadedModes, extensionManager);

  const closePopover = () => {
    setOpen(false);
  };

  const modeMenuRows: ToolbarMenuRow[] = [];
  if (studyEnvelope) {
    for (const mode of comparableModesList) {
      const validity = evaluateModeValidity(mode, studyEnvelope, labels.unableToEvaluate);
      if (!validity || validity.valid === null) {
        continue;
      }
      const routeName = mode.routeName;
      if (!routeName) {
        continue;
      }
      const modeHref = {
        pathname: `/${routeName}${dsSuffix ? `/${dsSuffix}` : ''}`,
        search: preservedSearch,
      };
      const isCurrentRoute = location.pathname === modeHref.pathname;
      const isDisabled = validity.valid !== true || isCurrentRoute;
      const label = mode.displayName || routeName;
      modeMenuRows.push({ mode, validity, modeHref, isCurrentRoute, isDisabled, label });
    }
  }

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
                'text-foreground/80 hover:bg-muted hover:text-highlight opacity-40'
              )}
              aria-label={labels.browseModes}
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
            <p className="text-xs leading-snug">{labels.loadingMetadata}</p>
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
                  : 'text-foreground/80 hover:bg-background hover:text-highlight bg-transparent'
              )}
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-label={labels.browseModes}
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
          <p className="text-xs">{labels.browseModes}</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        align="center"
        sideOffset={10}
        className={cn(
          'bg-popover/98 text-popover-foreground border-border/80 dark:border-border/55 dark:bg-popover dark:shadow-black/35 z-[100] flex w-[min(100vw-1.75rem,17.5rem)] max-w-none flex-col overflow-visible rounded-lg border p-0 shadow-xl shadow-black/10 backdrop-blur-md',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
        )}
      >
        <header className="border-border/40 border-b px-2.5 py-1.5">
          <p className="text-muted-foreground text-xs">{labels.modes}</p>
        </header>

        <ul
          role="menu"
          className="space-y-0.5 px-1.5 py-1.5"
        >
          {modeMenuRows.length === 0 ? (
            <li className="list-none">
              <p className="text-muted-foreground px-2 py-2 text-xs leading-snug">
                {labels.noModesAvailable}
              </p>
            </li>
          ) : (
            modeMenuRows.map(
              ({ mode: { routeName }, validity, modeHref, isCurrentRoute, isDisabled, label }) => (
                <li
                  key={routeName}
                  className="list-none"
                >
                  {!isDisabled ? (
                    <Link
                      role="menuitem"
                      tabIndex={0}
                      data-cy={`mode-selector-${routeName}`}
                      to={modeHref}
                      className={cn(
                        'group flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5',
                        'text-foreground ring-offset-background outline-none transition-colors duration-150',
                        'hover:bg-accent hover:text-accent-foreground focus-visible:ring-primary/35 active:bg-accent/90 focus-visible:ring-2 focus-visible:ring-offset-1'
                      )}
                      onClick={closePopover}
                    >
                      <span className="min-w-0 flex-1 truncate text-left text-sm leading-snug">
                        {label}
                      </span>
                      <Icons.ChevronRight
                        aria-hidden
                        className={cn(
                          'opacity-35 h-3.5 w-3.5 shrink-0 transition-opacity duration-150',
                          'text-muted-foreground group-hover:translate-x-px group-hover:opacity-100'
                        )}
                      />
                    </Link>
                  ) : isCurrentRoute ? (
                    <div
                      aria-current="true"
                      aria-label={`${label} — ${labels.currentMode}`}
                      className={cn(
                        'relative flex w-full cursor-default items-center justify-between gap-2 overflow-hidden rounded-lg px-2 py-1.5',
                        'border-primary/18 from-accent/85 via-accent/50 to-accent/30 text-foreground border bg-gradient-to-br',
                        'ring-border/50 shadow-[inset_0_1px_0_rgb(255_255_255/0.12)] ring-1 ring-inset',
                        'dark:from-accent/35 dark:via-accent/25 dark:to-muted/55 dark:ring-border/35 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]'
                      )}
                      data-cy={`mode-selector-current-${routeName}`}
                    >
                      <span className="text-foreground min-w-0 flex-1 truncate text-left text-sm font-medium leading-snug tracking-tight">
                        {label}
                      </span>
                      <span
                        aria-hidden
                        className="h-3.5 w-3.5 shrink-0 select-none self-center opacity-0"
                      />
                    </div>
                  ) : validity.description ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          role="menuitem"
                          tabIndex={0}
                          aria-disabled="true"
                          className={cn(
                            'text-muted-foreground flex w-full cursor-not-allowed rounded-lg px-2 py-1.5 opacity-[0.88]'
                          )}
                          data-cy={`mode-selector-disabled-${routeName}`}
                        >
                          <span className="min-w-0 flex-1 truncate text-left text-sm leading-snug">
                            {label}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        align="start"
                        side="top"
                        sideOffset={6}
                        className="z-[220] max-w-[236px]"
                      >
                        <p className="text-xs leading-snug">{validity.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <div
                      role="menuitem"
                      aria-disabled="true"
                      className={cn(
                        'text-muted-foreground flex w-full cursor-not-allowed rounded-lg px-2 py-1.5 opacity-[0.88]'
                      )}
                      data-cy={`mode-selector-disabled-${routeName}`}
                    >
                      <span className="min-w-0 flex-1 truncate text-left text-sm leading-snug">
                        {label}
                      </span>
                    </div>
                  )}
                </li>
              )
            )
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export default ToolbarModeSelector;
