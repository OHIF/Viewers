import React, { useState, useEffect, useMemo, useCallback } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import moment from 'moment';
import qs from 'query-string';
import isEqual from 'lodash.isequal';
import { useTranslation } from 'react-i18next';
import filtersMeta from './filtersMeta.js';
import { useAppConfig } from '@state';
import { useDebounce, useSearchParams } from '../../hooks';
import { utils, Types as coreTypes } from '@ohif/core';
import useSecureLocalStorage from 'secure-local-storage-hook';
import secureLocalStorage from 'react-secure-storage';

import {
  StudyListExpandedRow,
  EmptyStudies,
  StudyListTable,
  StudyListPagination,
  StudyListFilter,
  Button,
  ButtonEnums,
  Icon,
} from '@ohif/ui';

import {
  Icons,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Clipboard,
  useModal,
  useSessionStorage,
  ScrollArea,
  Header,
  LoadingIndicatorProgress,
} from '@ohif/ui-next';

import { Types } from '@ohif/ui';

import { preserveQueryParameters, preserveQueryStrings } from '../../utils/preserveQueryParameters';
import {
  CreateReportModal,
  FILTER_VALUES_KEY,
  REPORT_IDS_KEY,
  useAuthenticationContext,
  useGetReportIds,
  useXylexaAppContext,
} from '@xylexa/xylexa-app';
import { createPortal } from 'react-dom';

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
  const {
    setSelectedStudy,
    setSelectedModality,
    setGetStudyReportKey,
    setIsInsideViewer,
    setIsChangeInAnnotationViewPort,
    filteredList,
    setFilteredList,
  } = useXylexaAppContext();

  const { userInfo } = useAuthenticationContext();

  const { show, hide } = useModal();

  const [showModal, setShowModal] = useState<boolean>(false);
  const { t } = useTranslation();
  const [isTriaged, setIsTriaged] = useState(false);
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
  const [filterValues, _setFilterValues] = useSecureLocalStorage(FILTER_VALUES_KEY, {
    ...defaultFilterValues,
    ...sessionQueryFilterValues,
  });

  const { data: reportIds } = useGetReportIds();

  useEffect(() => {
    measurementService.isChangeInViewPortAnnotationsDetected = false;
    const isFilterFieldEmpty = value => value?.length === 0;
    const isFilterFieldNull = value => value === null;

    const isNoFilterApplied = () => {
      return (
        isFilterFieldEmpty(filterValues?.modalities) &&
        isFilterFieldEmpty(filterValues?.description) &&
        isFilterFieldNull(filterValues?.studyDate?.startDate) &&
        isFilterFieldNull(filterValues?.studyDate?.endDate) &&
        isFilterFieldEmpty(filterValues?.mrn) &&
        isFilterFieldEmpty(filterValues?.patientName) &&
        isFilterFieldEmpty(filterValues?.report) &&
        isFilterFieldEmpty(filterValues?.referringPhysicianName)
      );
    };

    const isAnyFilterApplied = () => {
      return (
        !isFilterFieldEmpty(filterValues?.modalities) ||
        !isFilterFieldEmpty(filterValues?.description) ||
        !isFilterFieldNull(filterValues?.studyDate?.startDate) ||
        !isFilterFieldNull(filterValues?.studyDate?.endDate) ||
        !isFilterFieldEmpty(filterValues?.mrn) ||
        !isFilterFieldEmpty(filterValues?.patientName) ||
        !isFilterFieldEmpty(filterValues?.report) ||
        !isFilterFieldEmpty(filterValues?.referringPhysicianName)
      );
    };

    const isOnlyOHIFFiltersApplied = () => {
      return (
        (!isFilterFieldEmpty(filterValues?.modalities) ||
          !isFilterFieldEmpty(filterValues?.description) ||
          !isFilterFieldNull(filterValues?.studyDate?.startDate) ||
          !isFilterFieldNull(filterValues?.studyDate?.endDate) ||
          !isFilterFieldEmpty(filterValues?.mrn) ||
          !isFilterFieldEmpty(filterValues?.patientName)) &&
        isFilterFieldEmpty(filterValues?.report) &&
        isFilterFieldEmpty(filterValues?.referringPhysicianName)
      );
    };

    const getPredictedFilteredStudies = studies => {
      /**
       *  Here predictionOptions is the value of referringPhysicianName property.
       * Data is coming inconsistent from backend.
       * For CR modality:
       *    The format of referringPhysicianName will be "<blank space> PredictionStatus"
       *    e.g. " Normal" or " Suspicious" etc.
       * For MG modality:
       *    The format for referringPhysicianName will either be "patientName#PredictionStatus"
       *    or "#PredictionStatus"
       *    e.g. "--redracted--#Normal" or "#Suspicious" etc.
       * This the reason we are trimming the string using split method before filtering
       */
      const filteredStudies = studies.filter(study => {
        const mmgPredictionStatusArr = study?.referringPhysicianName?.split('#');
        const crPredictionStatusArr = study?.referringPhysicianName?.split(' ');

        return (
          filterValues?.referringPhysicianName.includes(crPredictionStatusArr[1]) ||
          filterValues?.referringPhysicianName.includes(mmgPredictionStatusArr[1])
        );
      });

      return filteredStudies;
    };

    const getReportFilteredStudies = studies => {
      const completedStudyIds = new Set(reportIds?.data?.study_ids || []);
      const filteredStudies = studies.filter(study => {
        return (
          (filterValues?.report.includes('Completed') &&
            completedStudyIds.has(study.studyInstanceUid)) ||
          (filterValues?.report.includes('Pending') &&
            !completedStudyIds.has(study.studyInstanceUid))
        );
      });
      return filteredStudies;
    };

    const getCommonStudies = (studyArr1, studyArr2) => {
      const commonStudies = studyArr1.filter(study1 => {
        return studyArr2.some(study2 => study1?.studyInstanceUid === study2.studyInstanceUid);
      });

      return commonStudies;
    };

    const isPredictionFilterApplied = () => {
      const predictionStatusArr = ['Normal', 'Suspicious'];
      const isFilterApplied = filterValues?.referringPhysicianName.some(value =>
        predictionStatusArr.includes(value)
      );
      return isFilterApplied;
    };
    const isReportFilterApplied = () => {
      const reportStatusArr = ['Completed', 'Pending'];
      const isFilterApplied = filterValues?.report?.some(value => reportStatusArr.includes(value));
      return isFilterApplied;
    };

    if (isNoFilterApplied()) {
      setFilteredList(studies);
    }

    /**
     * since OHIF built-in filters work with making queries to dicom-web
     * thats why handling them separately.
     */
    if (isOnlyOHIFFiltersApplied()) {
      setFilteredList(studies);
    }

    /**
     * handling XyCAD filters and OHIF-filters in combination
     */
    if (isAnyFilterApplied()) {
      if (isPredictionFilterApplied()) {
        const predictedFilteredStudies = getPredictedFilteredStudies(studies);

        setFilteredList(predictedFilteredStudies);
      }

      if (isReportFilterApplied()) {
        const filteredStudies = getReportFilteredStudies(studies);

        setFilteredList(filteredStudies);
      }

      if (isPredictionFilterApplied() && isReportFilterApplied()) {
        const predictedFilteredStudies = getPredictedFilteredStudies(studies);

        const reportFilteredStudies = getReportFilteredStudies(studies);

        const commonPredictedAndReportFilteredStudies = getCommonStudies(
          predictedFilteredStudies,
          reportFilteredStudies
        );

        setFilteredList(commonPredictedAndReportFilteredStudies);
      }
    }
  }, [filterValues, reportIds?.data?.study_ids, setFilteredList, studies]);

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

  const { customizationService, measurementService } = servicesManager.services;

  const sortedStudies = filteredList;

  if (canSort) {
    filteredList.sort((s1, s2) => {
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
  }

  // ~ Rows & Studies
  const [expandedRows, setExpandedRows] = useState([]);
  const [studiesWithSeriesData, setStudiesWithSeriesData] = useState([]);
  const numOfStudies = studiesTotal;
  const querying = useMemo(() => {
    return isLoadingData || expandedRows.length > 0;
  }, [isLoadingData, expandedRows]);

  const setTriageFilterValues = useCallback(
    val => {
      if (filterValues.pageNumber === val.pageNumber) {
        val.pageNumber = 1;
      }

      _setFilterValues({ ...filterValues, modalities: ['CR', 'DX'] });
      updateSessionQueryFilterValues(val);
      setExpandedRows([]);
    },
    [_setFilterValues, filterValues, updateSessionQueryFilterValues]
  );

  const applyTriageFilter = useCallback(() => {
    setTriageFilterValues(triagedFilters);
    setIsTriaged(true);
  }, [setTriageFilterValues]);

  const setFilterValues = useCallback(
    val => {
      if (filterValues.pageNumber === val.pageNumber) {
        val.pageNumber = 1;
      }

      _setFilterValues(val);
      updateSessionQueryFilterValues(val);
      setExpandedRows([]);
    },
    [_setFilterValues, filterValues.pageNumber, updateSessionQueryFilterValues]
  );

  const clearFilterValues = useCallback(() => {
    setFilterValues(defaultFilterValues);
    setIsTriaged(false);
  }, [setFilterValues, setIsTriaged]);

  const isReported = studyId => {
    const response = reportIds?.data.study_ids.find(id => {
      return id === studyId;
    });

    return response;
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

  // Set body style
  useEffect(() => {
    document.body.classList.add('bg-black');
    return () => {
      document.body.classList.remove('bg-black');
    };
  }, []);

  // Sync URL query parameters with filters
  useEffect(() => {
    if (!debouncedFilterValues) {
      return;
    }

    const queryString = {};
    Object.keys(defaultFilterValues).forEach(key => {
      const defaultValue = defaultFilterValues[key];
      const currValue = debouncedFilterValues[key];

      // TODO: nesting/recursion?
      if (key === 'studyDate') {
        if (currValue.startDate && defaultValue.startDate !== currValue.startDate) {
          queryString.startDate = currValue.startDate;
        }
        if (currValue.endDate && defaultValue.endDate !== currValue.endDate) {
          queryString.endDate = currValue.endDate;
        }
      } else if (key === 'modalities' && currValue.length) {
        queryString.modalities = currValue.join(',');
      } else if (key === 'referringPhysicianName' && currValue.length) {
        queryString.referringPhysicianName = currValue.join(',');
      } else if (currValue !== defaultValue) {
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

      const studyInstanceUid = sortedStudies[expandedRowIndex]?.studyInstanceUid;

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

  /**
   *
   * @param {string} predictionOption
   * Here predictionOptions is the value of referringPhysicianName property.
   * Data is coming inconsistent from backend.
   * For CR modality:
   *    The format of referringPhysicianName will be "<blank space> PredictionStatus"
   *    e.g. " Normal" or " Suspicious" etc.
   * For MG modality:
   *    The format for referringPhysicianName will either be "patientName#PredictionStatus"
   *    or "#PredictionStatus"
   *    e.g. "--redracted--#Normal" or "#Suspicious" etc.
   * This the reason we are trimming the string using split method
   *
   * @returns {string}
   */

  function getPrediction(predictionOption) {
    const mmgPredictionStatusArr = predictionOption.split('#');
    const crPredictionStatusArr = predictionOption.split(' ');
    let status;
    switch (mmgPredictionStatusArr[1] || crPredictionStatusArr[1]) {
      case 'Normal':
        status = 'Normal';
        break;

      case 'Suspicious':
        status = 'Suspicious';
        break;
      default:
        status = '-';
        break;
    }

    return status;
  }

  const rollingPageNumberMod = Math.floor(101 / resultsPerPage);
  const rollingPageNumber = (pageNumber - 1) % rollingPageNumberMod;
  const offset = resultsPerPage * rollingPageNumber;
  const offsetAndTake = offset + resultsPerPage;
  const tableDataSource = filteredList.map((study, key) => {
    const rowKey = key + 1;
    const isExpanded = expandedRows.some(k => k === rowKey);
    const {
      studyInstanceUid,
      modalities,
      referringPhysicianName, //predictions
      description,
      mrn,
      patientName,
      date,
      time,
    } = study;
    const studyDate =
      date &&
      moment(date, ['YYYYMMDD', 'YYYY.MM.DD'], true).isValid() &&
      moment(date, ['YYYYMMDD', 'YYYY.MM.DD']).format(t('Common:localDateFormat', 'MMM-DD-YYYY'));
    const studyTime =
      time &&
      moment(time, ['HH', 'HHmm', 'HHmmss', 'HHmmss.SSS']).isValid() &&
      moment(time, ['HH', 'HHmm', 'HHmmss', 'HHmmss.SSS']).format(
        t('Common:localTimeFormat', 'hh:mm A')
      );

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

    return {
      dataCY: `studyRow-${studyInstanceUid}`,
      clickableCY: studyInstanceUid,
      row: [
        {
          key: 'patientName',
          content: (
            <div className="flex flex-row">
              <div>
                <Icon
                  name={isExpanded ? 'chevron-down' : 'chevron-right'}
                  className="mr-4 inline-flex"
                />
              </div>
              {patientName ? (
                makeCopyTooltipCell(patientName)
              ) : (
                <span className="text-gray-700">(Empty)</span>
              )}
            </div>
          ),
          gridCol: 4,
        },
        {
          key: 'mrn',
          content: makeCopyTooltipCell(mrn),
          gridCol: 3,
        },
        {
          key: 'studyDate',
          content: (
            <>
              {studyDate && <span className="mr-4">{studyDate}</span>}
              {studyTime && <span>{studyTime}</span>}
            </>
          ),
          title: `${studyDate || ''} ${studyTime || ''}`,
          gridCol: 5,
        },
        {
          key: 'description',
          content: makeCopyTooltipCell(description),
          gridCol: 4,
        },
        {
          key: 'modality',
          content: modalities,
          title: modalities,
          gridCol: 3,
        },
        {
          key: 'referringPhysicianName', // prediction
          content: makeCopyTooltipCell(getPrediction(referringPhysicianName)),
          gridCol: 3,
        },
        {
          key: 'report',
          content: (
            <div className="flex flex-row justify-between">
              <div>
                {isReported(studyInstanceUid) ? (
                  <p className="text-primary-active hover:text-white">Completed</p>
                ) : (
                  <p>Pending</p>
                )}
              </div>
              <div
                key={key}
                onClick={function () {
                  const selectedStudyInstance = sortedStudies[key];
                  setSelectedStudy(selectedStudyInstance);
                  setSelectedModality(selectedStudyInstance?.modalities);
                  setIsInsideViewer(false);

                  if (isReported(studyInstanceUid)) {
                    setGetStudyReportKey('outside-viewer');
                  }

                  /**
                   * MG Modality modality has no template thats why directly redirecting to MMG Forms
                   * if the modality is MG
                   */

                  isReported(studyInstanceUid)
                    ? navigate(
                        `/report/view-report/?modality=${selectedStudyInstance?.modalities}&studyInstanceId=${studyInstanceUid}`
                      )
                    : selectedStudyInstance?.modalities === 'MG'
                      ? navigate(
                          `/report/write-report/?modality=${selectedStudyInstance?.modalities}&studyInstanceId=${studyInstanceUid}`
                        )
                      : setShowModal(true);
                }}
              >
                {
                  <Icon
                    name="clipboard"
                    className={classnames('w-4', {
                      'text-primary-active': isReported(studyInstanceUid),
                      'text-white': !isReported(studyInstanceUid),
                    })}
                  />
                }
              </div>
            </div>
          ),
          title: 'Patient Report',
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
              const modalitiesToCheck = modalities.replaceAll('/', '\\');

              const { valid: isValidMode, description: invalidModeDescription } = mode.isValidMode({
                modalities: modalitiesToCheck,
                study,
              });
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
                      size={ButtonEnums.size.medium}
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
                      onClick={() => {
                        secureLocalStorage.setItem(REPORT_IDS_KEY, reportIds);
                        const selectedStudyInstance = sortedStudies[key];
                        setSelectedModality(selectedStudyInstance?.modalities);
                        setSelectedStudy(selectedStudyInstance);
                        setGetStudyReportKey('inside-viewer');
                        setIsInsideViewer(true);
                        setIsChangeInAnnotationViewPort(false);
                      }}
                      dataCY={`mode-${mode.routeName}-${studyInstanceUid}`}
                      className={
                        isValidMode
                          ? 'bg-primary-active hover:bg-primary-light text-[13px'
                          : 'bg-[#222d44] text-[13px]'
                      }
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
      onClickRow: () =>
        setExpandedRows(s => (isExpanded ? s.filter(n => rowKey !== n) : [...s, rowKey])),
      isExpanded,
    };
  });

  const areStudiesAvailable = numOfStudies > 0;

  const AboutModal = customizationService.getCustomization(
    'ohif.aboutModal'
  ) as coreTypes.MenuComponentCustomization;
  const UserPreferencesModal = customizationService.getCustomization(
    'ohif.userPreferencesModal'
  ) as coreTypes.MenuComponentCustomization;

  const menuOptions = [
    {
      title: AboutModal?.menuTitle ?? t('Header:About'),
      icon: 'info',
      onClick: () =>
        show({
          content: AboutModal,
          title: AboutModal?.title ?? t('AboutModal:About OHIF Viewer'),
          containerClassName: AboutModal?.containerClassName ?? 'max-w-md',
        }),
    },
    {
      title: UserPreferencesModal.menuTitle ?? t('Header:Preferences'),
      icon: 'settings',
      onClick: () =>
        show({
          content: UserPreferencesModal as React.ComponentType,
          title: UserPreferencesModal.title ?? t('UserPreferencesModal:User preferences'),
          containerClassName:
            UserPreferencesModal?.containerClassName ?? 'flex max-w-4xl p-6 flex-col',
        }),
    },
    {
      title: t('Header:Logout'),
      icon: 'logout',
      onClick: () => {
        secureLocalStorage.clear();
        //TODO:  Implement proper re-routing to login page on logout
        navigate(0);
      },
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

  // const LoadingIndicatorProgress = customizationService.getCustomization(
  //   'ui.loadingIndicatorProgress'
  // );
  const DicomUploadComponent = customizationService.getCustomization('dicomUploadComponent');

  const uploadProps =
    DicomUploadComponent && dataSource.getConfig()?.dicomUploadEnabled
      ? {
          title: 'Upload files',
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
    <React.Fragment>
      {showModal &&
        createPortal(
          <CreateReportModal setShowModal={setShowModal} />,
          document.body,
          'createReportModal'
        )}

      <div className="flex h-screen flex-col bg-black">
        <Header
          isSticky
          menuOptions={menuOptions}
          isReturnEnabled={false}
          WhiteLabeling={appConfig.whiteLabeling}
          showPatientInfo={PatientInfoVisibility.DISABLED}
        />
        <div className="flex h-full flex-col overflow-y-auto">
          <ScrollArea>
            <div className="flex grow flex-col">
              <StudyListFilter
                numOfStudies={pageNumber * resultsPerPage > 100 ? 101 : numOfStudies}
                filtersMeta={filtersMeta}
                filterValues={{ ...filterValues, ...defaultSortValues }}
                onChange={setFilterValues}
                clearFilters={clearFilterValues}
                isTriaged={isTriaged}
                setIsTriaged={val => setIsTriaged(val)}
                triageFilters={applyTriageFilter}
                isFiltering={isFiltering(filterValues, defaultFilterValues)}
                onUploadClick={uploadProps ? () => show(uploadProps) : undefined}
                getDataSourceConfigurationComponent={
                  dataSourceConfigurationComponent
                    ? () => dataSourceConfigurationComponent()
                    : undefined
                }
              />
            </div>
            {areStudiesAvailable ? (
              <div className="flex grow flex-col">
                <StudyListTable
                  tableDataSource={tableDataSource.slice(offset, offsetAndTake)}
                  numOfStudies={numOfStudies}
                  querying={querying}
                  filtersMeta={filtersMeta}
                />
                {filteredList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center pt-48">
                    <EmptyStudies />
                  </div>
                ) : (
                  <div className="grow">
                    <StudyListPagination
                      onChangePage={onPageNumberChange}
                      onChangePerPage={onResultsPerPageChange}
                      currentPage={pageNumber}
                      perPage={resultsPerPage}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center pt-48">
                {appConfig.showLoadingIndicator && isLoadingData ? (
                  <LoadingIndicatorProgress />
                ) : (
                  <EmptyStudies />
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </React.Fragment>
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
  studyDate: {
    startDate: null,
    endDate: null,
  },
  description: '',
  modalities: [],
  referringPhysicianName: [], // prediction,
  report: [],
  accession: '',
  sortBy: '',
  sortDirection: 'none',
  pageNumber: 1,
  resultsPerPage: 25,
  datasources: '',
};

const triagedFilters = {
  patientName: '',
  mrn: '',
  studyDate: {
    startDate: null,
    endDate: null,
  },
  description: '',
  modalities: ['CR', 'DX'],
  referringPhysicianName: [], // prediction
  accession: '',
  sortBy: 'referringPhysicianName', // prediction
  report: [], // study status
  sortDirection: 'ascending',
  pageNumber: 1,
  resultsPerPage: 25,
  datasources: '',
  configUrl: null,
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

  const queryFilterValues = {
    patientName: params.get('patientname'),
    mrn: params.get('mrn'),
    studyDate: {
      startDate: params.get('startdate') || null,
      endDate: params.get('enddate') || null,
    },
    description: params.get('description'),
    modalities: params.get('modalities') ? params.get('modalities').split(',') : [],
    accession: params.get('accession'),
    referringPhysicianName: params.get('referringPhysicianName')
      ? params.get('referringPhysicianName').split(',')
      : [],
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
