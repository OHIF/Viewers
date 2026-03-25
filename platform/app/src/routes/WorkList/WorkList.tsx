import React, { useState, useEffect, useMemo, useCallback } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import moment from 'moment';
import qs from 'query-string';
import isEqual from 'lodash.isequal';
import { useTranslation } from 'react-i18next';
//
import filtersMeta from './filtersMeta.js';
import { useAppConfig } from '@state';
import { useDebounce, useSearchParams } from '../../hooks';
import { utils, Types as coreTypes } from '@ohif/core';

import {
  StudyListExpandedRow,
  EmptyStudies,
  StudyListTable,
  StudyListPagination,
  StudyListFilter,
  Button,
  ButtonEnums,
} from '@ohif/ui';

import {
  Icons,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Clipboard,
  useModal,
  useSessionStorage,
  Onboarding,
  ScrollArea,
  InvestigationalUseDialog,
  toast,
  Button as ButtonNext,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@ohif/ui-next';

import { Types } from '@ohif/ui';

import { preserveQueryParameters, preserveQueryStrings } from '../../utils/preserveQueryParameters';
import WorkListHeader from './WorkListHeader';

const PatientInfoVisibility = Types.PatientInfoVisibility;

const { sortBySeriesDate } = utils;

const seriesInStudiesMap = new Map();

/**
 * TODO:
 * - debounce `setFilterValues` (150ms?)
 */
function WorkList({
  data: studies,
  dataTotal: studiesTotal,
  isLoadingData,
  dataSource,
  hotkeysManager,
  dataPath,
  onRefresh,
  servicesManager,
}: withAppTypes) {
  const { show, hide } = useModal();
  const { t } = useTranslation();
  // ~ Modes
  const [appConfig] = useAppConfig();
  // ~ Filters
  const searchParams = useSearchParams();
  const navigate = useNavigate();
  const STUDIES_LIMIT = 101;
  const queryFilterValues = _getQueryFilterValues(searchParams);
  const [sessionQueryFilterValues, updateSessionQueryFilterValues] = useSessionStorage({
    key: 'queryFilterValues',
    defaultValue: queryFilterValues,
    // ToDo: useSessionStorage currently uses an unload listener to clear the filters from session storage
    // so on systems that do not support unload events a user will NOT be able to alter any existing filter
    // in the URL, load the page and have it apply.
    clearOnUnload: true,
  });
  const [filterValues, _setFilterValues] = useState({
    ...defaultFilterValues,
    ...sessionQueryFilterValues,
  });

  const debouncedFilterValues = useDebounce(filterValues, 200);
  const { resultsPerPage, pageNumber, sortBy, sortDirection } = filterValues;

  /*
   * The default sort value keep the filters synchronized with runtime conditional sorting
   * Only applied if no other sorting is specified and there are less than 101 studies
   */

  const canSort = studiesTotal < STUDIES_LIMIT;
  const shouldUseDefaultSort = sortBy === '' || !sortBy;
  const sortModifier = sortDirection === 'descending' ? 1 : -1;
  const defaultSortValues =
    shouldUseDefaultSort && canSort ? { sortBy: 'studyDate', sortDirection: 'ascending' } : {};
  const { customizationService } = servicesManager.services;

  const sortedStudies = useMemo(() => {
    if (!canSort) {
      return studies;
    }

    return [...studies].sort((s1, s2) => {
      if (shouldUseDefaultSort) {
        const ascendingSortModifier = -1;
        return _sortStringDates(s1, s2, ascendingSortModifier);
      }

      const s1Prop = s1[sortBy];
      const s2Prop = s2[sortBy];

      if (typeof s1Prop === 'string' && typeof s2Prop === 'string') {
        return s1Prop.localeCompare(s2Prop) * sortModifier;
      } else if (typeof s1Prop === 'number' && typeof s2Prop === 'number') {
        return (s1Prop > s2Prop ? 1 : -1) * sortModifier;
      } else if (!s1Prop && s2Prop) {
        return -1 * sortModifier;
      } else if (!s2Prop && s1Prop) {
        return 1 * sortModifier;
      } else if (sortBy === 'studyDate') {
        return _sortStringDates(s1, s2, sortModifier);
      }

      return 0;
    });
  }, [canSort, studies, shouldUseDefaultSort, sortBy, sortModifier]);

  // ~ Rows & Studies
  const [expandedRows, setExpandedRows] = useState([]);
  const [studiesWithSeriesData, setStudiesWithSeriesData] = useState([]);
  const numOfStudies = studiesTotal;
  const querying = useMemo(() => {
    return isLoadingData || expandedRows.length > 0;
  }, [isLoadingData, expandedRows]);

  const setFilterValues = val => {
    if (filterValues.pageNumber === val.pageNumber) {
      val.pageNumber = 1;
    }
    _setFilterValues(val);
    updateSessionQueryFilterValues(val);
    setExpandedRows([]);
  };

  const onPageNumberChange = newPageNumber => {
    const oldPageNumber = filterValues.pageNumber;
    const rollingPageNumberMod = Math.floor(101 / filterValues.resultsPerPage);
    const rollingPageNumber = oldPageNumber % rollingPageNumberMod;
    const isNextPage = newPageNumber > oldPageNumber;
    const hasNextPage = Math.max(rollingPageNumber, 1) * resultsPerPage < numOfStudies;

    if (isNextPage && !hasNextPage) {
      return;
    }

    setFilterValues({ ...filterValues, pageNumber: newPageNumber });
  };

  const onResultsPerPageChange = newResultsPerPage => {
    setFilterValues({
      ...filterValues,
      pageNumber: 1,
      resultsPerPage: Number(newResultsPerPage),
    });
  };

  // Set body style (white theme for worklist)
  useEffect(() => {
    document.body.classList.add('bg-white');
    return () => {
      document.body.classList.remove('bg-white');
    };
  }, []);

  // Sync URL query parameters with filters
  useEffect(() => {
    if (!debouncedFilterValues) {
      return;
    }

    const queryString = {};
    const periodType = debouncedFilterValues.periodType ?? 'custom';
    const studyDate = debouncedFilterValues.studyDate ?? { startDate: null, endDate: null };

    // searchQuery -> patientName + MRN (single search filters both)
    const searchQuery = debouncedFilterValues.searchQuery ?? '';
    if (searchQuery) {
      queryString.patientname = searchQuery;
      queryString.mrn = searchQuery;
    }

    // Period: compute startDate/endDate from periodType or use custom studyDate
    let startDate = null;
    let endDate = null;
    if (periodType === 'today') {
      startDate = endDate = moment().format('YYYYMMDD');
    } else if (periodType === '7d') {
      startDate = moment().subtract(7, 'days').format('YYYYMMDD');
      endDate = moment().format('YYYYMMDD');
    } else if (periodType === '30d') {
      startDate = moment().subtract(30, 'days').format('YYYYMMDD');
      endDate = moment().format('YYYYMMDD');
    } else if (studyDate?.startDate || studyDate?.endDate) {
      startDate = studyDate.startDate || null;
      endDate = studyDate.endDate || null;
    }
    if (startDate) queryString.startDate = startDate;
    if (endDate) queryString.endDate = endDate;

    if (debouncedFilterValues.modalities?.length) {
      queryString.modalities = debouncedFilterValues.modalities.join(',');
    }
    Object.keys(defaultFilterValues).forEach(key => {
      if (['searchQuery', 'periodType', 'statusFilter', 'scopeFilter', 'studyDate', 'patientName', 'mrn'].includes(key)) {
        return;
      }
      const defaultValue = defaultFilterValues[key];
      const currValue = debouncedFilterValues[key];
      if (key === 'studyDate') return;
      if (currValue !== defaultValue && currValue !== undefined && currValue !== null) {
        if (key === 'modalities') return; // already handled
        queryString[key] = currValue;
      }
    });

    preserveQueryStrings(queryString);

    const search = qs.stringify(queryString, {
      skipNull: true,
      skipEmptyString: true,
    });
    navigate({
      pathname: '/',
      search: search ? `?${search}` : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFilterValues]);

  const getSeriesForStudy = useCallback(
    async studyInstanceUid => {
      if (seriesInStudiesMap.has(studyInstanceUid)) {
        return seriesInStudiesMap.get(studyInstanceUid);
      }
      const series = await dataSource.query.series.search(studyInstanceUid);
      const sorted = sortBySeriesDate(series);
      seriesInStudiesMap.set(studyInstanceUid, sorted);
      setStudiesWithSeriesData(prev =>
        prev.includes(studyInstanceUid) ? prev : [...prev, studyInstanceUid]
      );
      return sorted;
    },
    [dataSource]
  );

  // Query for series information
  useEffect(() => {
    const fetchSeries = async studyInstanceUid => {
      try {
        const series = await dataSource.query.series.search(studyInstanceUid);
        seriesInStudiesMap.set(studyInstanceUid, sortBySeriesDate(series));
        setStudiesWithSeriesData([...studiesWithSeriesData, studyInstanceUid]);
      } catch (ex) {
        // TODO: UI Notification Service
        console.warn(ex);
      }
    };

    // TODO: WHY WOULD YOU USE AN INDEX OF 1?!
    // Note: expanded rows index begins at 1
    for (let z = 0; z < expandedRows.length; z++) {
      const expandedRowIndex = expandedRows[z] - 1;
      const studyInstanceUid = sortedStudies[expandedRowIndex].studyInstanceUid;

      if (studiesWithSeriesData.includes(studyInstanceUid)) {
        continue;
      }

      fetchSeries(studyInstanceUid);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedRows, studies]);

  const isFiltering = (filterValues, defaultFilterValues) => {
    return !isEqual(filterValues, defaultFilterValues);
  };

  const PRIORITY_LIST_SIZE = 5;
  const priorityCount = Math.min(PRIORITY_LIST_SIZE, sortedStudies.length);
  const restCount = Math.max(0, numOfStudies - PRIORITY_LIST_SIZE);
  const totalRestPages = Math.max(1, Math.ceil(restCount / resultsPerPage));
  const [restPageNumber, setRestPageNumber] = useState(1);
  const restOffset = (restPageNumber - 1) * resultsPerPage;

  useEffect(() => {
    setRestPageNumber(1);
  }, [debouncedFilterValues]);

  const studyListHeaderColumns = [
    { label: t('StudyList:PatientName'), width: '15%' },
    { label: t('StudyList:DSN'), width: '11%' },
    { label: t('StudyList:DateEtHeure'), width: '13%' },
    { label: t('StudyList:Description'), width: '18%' },
    { label: t('StudyList:Modality'), width: '8%' },
    { label: t('StudyList:NumberOfSeries'), width: '7%', sortable: false },
    { label: t('StudyList:Statut'), width: '7%' },
    { label: t('StudyList:Images'), width: '6%', sortable: false },
    { label: t('StudyList:ActionsRapides'), width: '9%', sortable: false },
  ];

  const getStudyViewerLink = study => {
    const { modalities: mods, studyInstanceUid: uid } = study;
    const modes = appConfig.groupEnabledModesFirst
      ? [...appConfig.loadedModes].sort((a, b) => {
          const isValidA = a.isValidMode({ modalities: mods?.replaceAll?.('/', '\\') || '', study }).valid;
          const isValidB = b.isValidMode({ modalities: mods?.replaceAll?.('/', '\\') || '', study }).valid;
          return isValidB - isValidA;
        })
      : appConfig.loadedModes;
    const mode = modes.find(m => !m.hide && m.isValidMode({ modalities: mods?.replaceAll?.('/', '\\') || '', study }).valid);
    if (!mode?.displayName) return null;
    const query = new URLSearchParams();
    if (filterValues.configUrl) query.append('configUrl', filterValues.configUrl);
    query.append('StudyInstanceUIDs', uid);
    preserveQueryParameters(query);
    return `${mode.routeName}${dataPath || ''}?${query.toString()}`;
  };

  const modalityBadgeClass = mod => {
    const m = (mod || '').trim().toUpperCase();
    if (m === 'CT') return 'bg-[#8b5cf6] text-white';
    if (m === 'XR' || m === 'CR' || m === 'DX') return 'bg-[#ec4899] text-white';
    if (m === 'MR') return 'bg-[#3b82f6] text-white';
    if (m === 'US') return 'bg-[#10b981] text-white';
    if (m === 'PT' || m === 'PET') return 'bg-[#f59e0b] text-white';
    if (m === 'NM') return 'bg-[#f97316] text-white';
    if (m === 'MG') return 'bg-[#14b8a6] text-white';
    if (m === 'SR') return 'bg-[#a78bfa] text-white';
    return 'bg-[#6b7280] text-white';
  };

  const renderModalityBadges = modalities => {
    if (!modalities) return null;
    const mods = modalities.split(/[/\\]/).map(m => m.trim()).filter(Boolean);
    return (
      <div className="flex flex-wrap gap-1">
        {mods.map((mod, i) => (
          <span
            key={i}
            className={classnames(
              'inline-flex rounded px-1.5 py-0.5 text-[11px] font-medium leading-tight',
              modalityBadgeClass(mod)
            )}
          >
            {mod}
          </span>
        ))}
      </div>
    );
  };

  const tableDataSource = sortedStudies.map((study, key) => {
    const rowKey = key + 1;
    const isExpanded = expandedRows.some(k => k === rowKey);
    const {
      studyInstanceUid,
      modalities,
      instances,
      numSeries,
      description,
      mrn,
      patientName,
      date,
      time,
    } = study;
    const studyDateFr =
      date &&
      moment(date, ['YYYYMMDD', 'YYYY.MM.DD'], true).isValid() &&
      moment(date, ['YYYYMMDD', 'YYYY.MM.DD']).format('DD/MM/YYYY');
    const studyTimeFr =
      time &&
      moment(time, ['HH', 'HHmm', 'HHmmss', 'HHmmss.SSS']).isValid() &&
      moment(time, ['HH', 'HHmm', 'HHmmss', 'HHmmss.SSS']).format('HH:mm');
    const dateTimeFr = [studyDateFr, studyTimeFr].filter(Boolean).join(' ');

    const makeCopyTooltipCell = textValue => {
      if (!textValue) {
        return '';
      }
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-pointer truncate">{textValue}</span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="flex items-center justify-between gap-2">
              {textValue}
              <Clipboard>{textValue}</Clipboard>
            </div>
          </TooltipContent>
        </Tooltip>
      );
    };

    const viewerHref = getStudyViewerLink(study);
    const modalitiesToCheck = (modalities || '').replaceAll('/', '\\');
    const validModes = (appConfig.groupEnabledModesFirst
      ? [...appConfig.loadedModes].sort((a, b) => {
          const isValidA = a.isValidMode({ modalities: modalitiesToCheck, study }).valid;
          const isValidB = b.isValidMode({ modalities: modalitiesToCheck, study }).valid;
          return isValidB - isValidA;
        })
      : appConfig.loadedModes
    ).filter(m => !m.hide && m.displayName);

    const actionsCell = (
      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
        <button
          type="button"
          className="text-[#374151] hover:text-[#111827]"
          title="Détails"
          onClick={async e => {
            e.stopPropagation();
            let seriesList = [];
            try {
              seriesList = await getSeriesForStudy(studyInstanceUid) || [];
            } catch (err) {
              console.warn(err);
            }
            const rows = seriesList.map(s => ({
              description: s.description || '(empty)',
              seriesNumber: s.seriesNumber ?? '',
              modality: s.modality || '',
              instances: s.numSeriesInstances ?? '',
            }));
            show({
              title: t('StudyList:DetailsInstances') || 'Détails des instances',
              containerClassName: 'max-w-2xl bg-white text-[#374151] border border-[#e5e7eb] rounded-lg shadow-lg p-4',
              content: () => (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm" style={{ fontFamily: 'Roboto, sans-serif' }}>
                    <thead>
                      <tr className="border-b border-[#e5e7eb]">
                        <th className="px-3 py-2 text-left font-medium text-[#6b7280]">{t('StudyList:Description')}</th>
                        <th className="px-3 py-2 text-left font-medium text-[#6b7280]">{t('StudyList:Series')}</th>
                        <th className="px-3 py-2 text-left font-medium text-[#6b7280]">{t('StudyList:Modality')}</th>
                        <th className="px-3 py-2 text-left font-medium text-[#6b7280]">{t('StudyList:Instances')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr><td colSpan={4} className="px-3 py-4 text-[#6b7280]">—</td></tr>
                      ) : (
                        rows.map((row, i) => (
                          <tr key={i} className="border-b border-[#f3f4f6]">
                            <td className="px-3 py-2">{row.description}</td>
                            <td className="px-3 py-2">{row.seriesNumber}</td>
                            <td className="px-3 py-2">{row.modality}</td>
                            <td className="px-3 py-2">{row.instances}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ),
            });
          }}
        >
          <Icons.Info className="h-4 w-4" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ButtonNext
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#374151] hover:bg-[#f3f4f6]"
              title="Actions"
              onClick={e => e.stopPropagation()}
            >
              <Icons.More className="h-4 w-4" />
            </ButtonNext>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[200px] border border-[#e5e7eb] bg-white shadow-lg">
            {validModes.map((mode, i) => {
              const { valid: isValidMode } = mode.isValidMode({ modalities: modalitiesToCheck, study });
              if (!isValidMode) return null;
              const query = new URLSearchParams();
              if (filterValues.configUrl) query.append('configUrl', filterValues.configUrl);
              query.append('StudyInstanceUIDs', studyInstanceUid);
              preserveQueryParameters(query);
              const modeHref = `${mode.routeName}${dataPath || ''}?${query.toString()}`;
              return (
                <DropdownMenuItem key={i} asChild>
                  <Link to={modeHref} className="flex cursor-pointer items-center py-2 text-[#374151]">
                    {mode.displayName}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );

    return {
      dataCY: `studyRow-${studyInstanceUid}`,
      clickableCY: studyInstanceUid,
      row: [
        {
          key: 'patientName',
          content: patientName ? makeCopyTooltipCell(patientName) : null,
          gridCol: 3,
        },
        {
          key: 'mrn',
          content: makeCopyTooltipCell(mrn),
          gridCol: 2,
        },
        {
          key: 'studyDate',
          content: dateTimeFr || '—',
          title: dateTimeFr,
          gridCol: 3,
        },
        {
          key: 'description',
          content: makeCopyTooltipCell(description),
          gridCol: 4,
        },
        {
          key: 'modality',
          content: renderModalityBadges(modalities),
          title: modalities,
          gridCol: 2,
        },
        {
          key: 'numSeries',
          content: numSeries != null ? String(numSeries) : '—',
          title: numSeries != null ? String(numSeries) : '',
          gridCol: 2,
        },
        {
          key: 'statut',
          content: <span className="font-medium text-[#ef4444]">{t('StudyList:NonLu')}</span>,
          title: t('StudyList:NonLu'),
          gridCol: 2,
        },
        {
          key: 'images',
          content: instances ?? '—',
          title: (instances || 0).toString(),
          gridCol: 2,
        },
        {
          key: 'actions',
          content: actionsCell,
          gridCol: 2,
        },
      ],
      // Todo: This is actually running for all rows, even if they are
      // not clicked on.
      expandedContent: (
        <StudyListExpandedRow
          seriesTableColumns={{
            description: t('StudyList:Description'),
            seriesNumber: t('StudyList:Series'),
            modality: t('StudyList:Modality'),
            instances: t('StudyList:Instances'),
          }}
          seriesTableDataSource={
            seriesInStudiesMap.has(studyInstanceUid)
              ? seriesInStudiesMap.get(studyInstanceUid).map(s => {
                  return {
                    description: s.description || '(empty)',
                    seriesNumber: s.seriesNumber ?? '',
                    modality: s.modality || '',
                    instances: s.numSeriesInstances || '',
                  };
                })
              : []
          }
        >
          <div className="flex flex-row gap-2">
            {(appConfig.groupEnabledModesFirst
              ? appConfig.loadedModes.sort((a, b) => {
                  const isValidA = a.isValidMode({
                    modalities: modalities.replaceAll('/', '\\'),
                    study,
                  }).valid;
                  const isValidB = b.isValidMode({
                    modalities: modalities.replaceAll('/', '\\'),
                    study,
                  }).valid;

                  return isValidB - isValidA;
                })
              : appConfig.loadedModes
            ).map((mode, i) => {
              if (mode.hide) {
                // Hide this mode from display
                return null;
              }
              const modalitiesToCheck = modalities.replaceAll('/', '\\');

              const { valid: isValidMode, description: invalidModeDescription } = mode.isValidMode({
                modalities: modalitiesToCheck,
                study,
              });
              if (isValidMode === null) {
                // Hide this as a computed result.
                return null;
              }

              // TODO: Modes need a default/target route? We mostly support a single one for now.
              // We should also be using the route path, but currently are not
              // mode.routeName
              // mode.routes[x].path
              // Don't specify default data source, and it should just be picked up... (this may not currently be the case)
              // How do we know which params to pass? Today, it's just StudyInstanceUIDs and configUrl if exists
              const query = new URLSearchParams();
              if (filterValues.configUrl) {
                query.append('configUrl', filterValues.configUrl);
              }
              query.append('StudyInstanceUIDs', studyInstanceUid);
              preserveQueryParameters(query);

              return (
                mode.displayName && (
                  <Link
                    className={isValidMode ? '' : 'cursor-not-allowed'}
                    key={i}
                    to={`${mode.routeName}${dataPath || ''}?${query.toString()}`}
                    onClick={event => {
                      // In case any event bubbles up for an invalid mode, prevent the navigation.
                      // For example, the event bubbles up when the icon embedded in the disabled button is clicked.
                      if (!isValidMode) {
                        event.preventDefault();
                      }
                    }}
                    // to={`${mode.routeName}/dicomweb?StudyInstanceUIDs=${studyInstanceUid}`}
                  >
                    {/* TODO revisit the completely rounded style of buttons used for launching a mode from the worklist later */}
                    <Button
                      type={ButtonEnums.type.primary}
                      size={ButtonEnums.size.smallTall}
                      disabled={!isValidMode}
                      startIconTooltip={
                        !isValidMode ? (
                          <div className="font-inter flex w-[206px] whitespace-normal text-left text-xs font-normal text-white">
                            {invalidModeDescription}
                          </div>
                        ) : null
                      }
                      startIcon={
                        isValidMode ? (
                          <Icons.LaunchArrow className="!h-[20px] !w-[20px] text-black" />
                        ) : (
                          <Icons.LaunchInfo className="!h-[20px] !w-[20px] text-black" />
                        )
                      }
                      onClick={() => {}}
                      dataCY={`mode-${mode.routeName}-${studyInstanceUid}`}
                      className={!isValidMode && 'bg-[#222d44]'}
                    >
                      {mode.displayName}
                    </Button>
                  </Link>
                )
              );
            })}
          </div>
        </StudyListExpandedRow>
      ),
      onClickRow: () => {
        if (viewerHref) {
          navigate(viewerHref);
        } else {
          setExpandedRows(s => (isExpanded ? s.filter(n => rowKey !== n) : [...s, rowKey]));
        }
      },
      isExpanded,
    };
  });

  const restStudies = tableDataSource.slice(
    PRIORITY_LIST_SIZE + restOffset,
    PRIORITY_LIST_SIZE + restOffset + resultsPerPage
  );

  const hasStudies = numOfStudies > 0;

  const UserPreferencesModal = customizationService.getCustomization(
    'ohif.userPreferencesModal'
  ) as coreTypes.MenuComponentCustomization;

  const menuOptions = [
    {
      title: UserPreferencesModal.menuTitle ?? t('Header:Preferences'),
      icon: 'settings',
      onClick: () =>
        show({
          content: UserPreferencesModal as React.ComponentType,
          title: UserPreferencesModal.title ?? t('UserPreferencesModal:User preferences'),
          containerClassName:
            'flex max-w-4xl flex-col gap-0 rounded-xl border border-[#e5e7eb] bg-white pt-6 px-6 pb-0 text-[#374151] shadow-xl [&_.text-primary-light]:text-[#111827] [&_.text-primary]:text-[#6b7280] [&_.text-primary]:hover:text-[#374151] [&_button]:rounded-lg',
        }),
    },
  ];

  if (appConfig.oidc) {
    menuOptions.push({
      icon: 'power-off',
      title: t('Header:Logout'),
      onClick: () => {
        navigate(`/logout?redirect_uri=${encodeURIComponent(window.location.href)}`);
      },
    });
  }

  const LoadingIndicatorProgress = customizationService.getCustomization(
    'ui.loadingIndicatorProgress'
  );
  const DicomUploadComponent = customizationService.getCustomization('dicomUploadComponent');

  const uploadProps =
    DicomUploadComponent && dataSource.getConfig()?.dicomUploadEnabled
      ? {
          title: 'Upload files',
          containerClassName: DicomUploadComponent?.containerClassName,
          closeButton: true,
          shouldCloseOnEsc: false,
          shouldCloseOnOverlayClick: false,
          content: () => (
            <DicomUploadComponent
              dataSource={dataSource}
              onComplete={() => {
                hide();
                onRefresh();
              }}
              onStarted={() => {
                show({
                  ...uploadProps,
                  // when upload starts, hide the default close button as closing the dialogue must be handled by the upload dialogue itself
                  closeButton: false,
                });
              }}
            />
          ),
        }
      : undefined;

  const dataSourceConfigurationComponent = customizationService.getCustomization(
    'ohif.dataSourceConfigurationComponent'
  );

  return (
    <div className="flex h-screen flex-col bg-white">
      <WorkListHeader
        menuOptions={menuOptions}
        onNotificationClick={() => toast.info("Vous n'avez aucunes notifications")}
      />
      <Onboarding />
      <InvestigationalUseDialog dialogConfiguration={appConfig?.investigationalUseDialog} />
      <div className="flex h-full flex-col overflow-y-auto">
        <ScrollArea>
          <div className="flex grow flex-col">
            <StudyListFilter
              numOfStudies={pageNumber * resultsPerPage > 100 ? 101 : numOfStudies}
              filtersMeta={filtersMeta}
              filterValues={{ ...filterValues, ...defaultSortValues }}
              onChange={setFilterValues}
              clearFilters={() => setFilterValues(defaultFilterValues)}
              isFiltering={isFiltering(filterValues, defaultFilterValues)}
              onUploadClick={uploadProps ? () => show(uploadProps) : undefined}
              getDataSourceConfigurationComponent={
                dataSourceConfigurationComponent
                  ? () => dataSourceConfigurationComponent()
                  : undefined
              }
              useNewDesign
            />
          </div>
          {hasStudies ? (
            <div className="flex grow flex-col gap-4 bg-[#f3f4f6] p-4">
              {priorityCount > 0 && (
                <StudyListTable
                  sectionTitle={t('StudyList:ExamensPrioritaires')}
                  sectionCount={priorityCount}
                  headerColumns={studyListHeaderColumns}
                  useLightTheme
                  tableDataSource={tableDataSource.slice(0, priorityCount)}
                  querying={querying}
                />
              )}
              {restStudies.length > 0 && (
                <StudyListTable
                  sectionTitle={t('StudyList:ListeDesExamens')}
                  sectionCount={restCount}
                  headerColumns={studyListHeaderColumns}
                  useLightTheme
                  tableDataSource={restStudies}
                  querying={querying}
                />
              )}
              {restCount > 0 && (
                <div
                  className="flex items-center justify-end gap-4 rounded-lg bg-white px-5 py-3 shadow-sm"
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                    <span>{t('StudyList:Results per page')}</span>
                    <select
                      className="rounded border border-[#d1d5db] bg-white px-2 py-1 text-sm text-[#374151]"
                      value={resultsPerPage}
                      onChange={e => onResultsPerPageChange(Number(e.target.value))}
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <span className="text-sm text-[#6b7280]">
                    {t('StudyList:Page')} {restPageNumber}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="rounded px-2 py-1 text-sm text-[#374151] hover:bg-[#f3f4f6] disabled:opacity-30"
                      onClick={() => setRestPageNumber(1)}
                      disabled={restPageNumber <= 1}
                    >|&lt;</button>
                    <button
                      type="button"
                      className="rounded px-2 py-1 text-sm text-[#374151] hover:bg-[#f3f4f6] disabled:opacity-30"
                      onClick={() => setRestPageNumber(Math.max(1, restPageNumber - 1))}
                      disabled={restPageNumber <= 1}
                    >&lt;</button>
                    <button
                      type="button"
                      className="rounded px-2 py-1 text-sm text-[#374151] hover:bg-[#f3f4f6] disabled:opacity-30"
                      onClick={() => setRestPageNumber(restPageNumber + 1)}
                      disabled={restPageNumber >= totalRestPages}
                    >&gt;</button>
                    <button
                      type="button"
                      className="rounded px-2 py-1 text-sm text-[#374151] hover:bg-[#f3f4f6] disabled:opacity-30"
                      onClick={() => setRestPageNumber(totalRestPages)}
                      disabled={restPageNumber >= totalRestPages}
                    >&gt;|</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center pt-48">
              {appConfig.showLoadingIndicator && isLoadingData ? (
                <LoadingIndicatorProgress className={'h-full w-full bg-black'} />
              ) : (
                <EmptyStudies />
              )}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

WorkList.propTypes = {
  data: PropTypes.array.isRequired,
  dataSource: PropTypes.shape({
    query: PropTypes.object.isRequired,
    getConfig: PropTypes.func,
  }).isRequired,
  isLoadingData: PropTypes.bool.isRequired,
  servicesManager: PropTypes.object.isRequired,
};

const defaultFilterValues = {
  patientName: '',
  mrn: '',
  searchQuery: '',
  periodType: '30d',
  studyDate: {
    startDate: null,
    endDate: null,
  },
  description: '',
  modalities: [],
  accession: '',
  statusFilter: 'nonLu',
  scopeFilter: 'tous',
  sortBy: '',
  sortDirection: 'none',
  pageNumber: 1,
  resultsPerPage: 25,
  datasources: '',
};

function _tryParseInt(str, defaultValue) {
  let retValue = defaultValue;
  if (str && str.length > 0) {
    if (!isNaN(str)) {
      retValue = parseInt(str);
    }
  }
  return retValue;
}

function _getQueryFilterValues(params) {
  const newParams = new URLSearchParams();
  for (const [key, value] of params) {
    newParams.set(key.toLowerCase(), value);
  }
  params = newParams;

  const patientname = params.get('patientname');
  const mrn = params.get('mrn');
  const startdate = params.get('startdate') || null;
  const enddate = params.get('enddate') || null;
  const hasDateInUrl = startdate || enddate;
  const queryFilterValues = {
    patientName: patientname || '',
    mrn: mrn || '',
    searchQuery: patientname || mrn || '',
    periodType: hasDateInUrl ? 'custom' : undefined,
    studyDate: {
      startDate: startdate,
      endDate: enddate,
    },
    description: params.get('description'),
    modalities: params.get('modalities') ? params.get('modalities').split(',') : [],
    accession: params.get('accession'),
    statusFilter: 'nonLu',
    scopeFilter: 'tous',
    sortBy: params.get('sortby'),
    sortDirection: params.get('sortdirection'),
    pageNumber: _tryParseInt(params.get('pagenumber'), undefined),
    resultsPerPage: _tryParseInt(params.get('resultsperpage'), undefined),
    datasources: params.get('datasources'),
    configUrl: params.get('configurl'),
  };

  // Delete null/undefined keys
  Object.keys(queryFilterValues).forEach(
    key => queryFilterValues[key] == null && delete queryFilterValues[key]
  );

  return queryFilterValues;
}

function _sortStringDates(s1, s2, sortModifier) {
  // TODO: Delimiters are non-standard. Should we support them?
  const s1Date = moment(s1.date, ['YYYYMMDD', 'YYYY.MM.DD'], true);
  const s2Date = moment(s2.date, ['YYYYMMDD', 'YYYY.MM.DD'], true);

  if (s1Date.isValid() && s2Date.isValid()) {
    return (s1Date.toISOString() > s2Date.toISOString() ? 1 : -1) * sortModifier;
  } else if (s1Date.isValid()) {
    return sortModifier;
  } else if (s2Date.isValid()) {
    return -1 * sortModifier;
  }
}

export default WorkList;
