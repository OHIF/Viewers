import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import isEqual from 'lodash.isequal';
import { useAppConfig } from '@state';
import { useDebounce, useSearchParams } from '../../hooks';

import { StudyListPagination } from '@ohif/ui';

import {
  Icons,
  useSessionStorage,
  SkeletonLoader,
  FilterPresets,
  DashboardLayout,
  StudyListView,
  ViewModeToggle,
} from '@ohif/ui-next';

import { preserveQueryParameters } from '../../utils/preserveQueryParameters';

const defaultFilterValues = {
  patientName: '',
  mrn: '',
  studyDate: {
    startDate: null,
    endDate: null,
  },
  description: '',
  modalities: [],
  accession: '',
  sortBy: '',
  sortDirection: 'none',
  pageNumber: 1,
  resultsPerPage: 25,
  datasources: '',
};

function WorkList({
  data: studies,
  dataTotal: studiesTotal,
  isLoadingData,
  dataSource,
  hotkeysManager,
  dataPath,
  onRefresh,
  servicesManager,
}) {
  const [appConfig] = useAppConfig();
  const navigate = useNavigate();
  const searchParams = useSearchParams();

  const queryFilterValues = _getQueryFilterValues(searchParams);
  const [sessionQueryFilterValues, updateSessionQueryFilterValues] = useSessionStorage({
    key: 'queryFilterValues',
    defaultValue: queryFilterValues,
    clearOnUnload: true,
  });

  const [filterValues, _setFilterValues] = useState({
    ...defaultFilterValues,
    ...sessionQueryFilterValues,
  });

  const debouncedFilterValues = useDebounce(filterValues, 200);

  const setFilterValues = val => {
    if (isEqual(val, filterValues)) {
      return;
    }
    _setFilterValues(val);
    updateSessionQueryFilterValues(val);
  };

  const { pageNumber, resultsPerPage } = filterValues;

  useEffect(() => {
    if (!isEqual(debouncedFilterValues, sessionQueryFilterValues)) {
      updateSessionQueryFilterValues(debouncedFilterValues);
    }
  }, [debouncedFilterValues]);

  const onPageNumberChange = newPageNumber => {
    setFilterValues({ ...filterValues, pageNumber: newPageNumber });
  };

  const onRowsPerPageChange = newRowsPerPage => {
    setFilterValues({
      ...filterValues,
      pageNumber: 1,
      resultsPerPage: parseInt(newRowsPerPage),
    });
  };

  const handleStudyClick = study => {
    const { studyInstanceUid, modalities } = study;
    const modalitiesToCheck = modalities?.replaceAll?.('/', '\\') || '';

    const validMode = appConfig.loadedModes.find(mode => {
      return (
        !mode.hide &&
        mode.isValidMode({
          modalities: modalitiesToCheck,
          study,
        }).valid
      );
    });

    if (validMode) {
      const query = new URLSearchParams();
      if (filterValues.configUrl) {
        query.append('configUrl', filterValues.configUrl);
      }
      query.append('StudyInstanceUIDs', studyInstanceUid);
      preserveQueryParameters(query);

      navigate(`${validMode.routeName}${dataPath || ''}?${query.toString()}`);
    }
  };

  const handlePresetSelected = preset => {
    setFilterValues({ ...filterValues, ...preset.filterValues, pageNumber: 1 });
  };

  const menuOptions = [
    {
      label: 'Studies',
      icon: <Icons.TabStudies className="h-5 w-5" />,
      path: '/',
    },
    {
      label: 'Settings',
      icon: <Icons.Settings className="h-5 w-5" />,
      path: '/settings',
    },
  ];

  const [viewMode, setViewMode] = useState('grid');

  return (
    <DashboardLayout
      menuOptions={menuOptions}
      activePath="/"
      onMenuClick={option => console.log('Menu clicked:', option)}
      headerTitle="Study List"
      headerContent={
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Icons.Search className="text-info-muted absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search studies..."
              className="border-glass-border bg-bkg-med/50 placeholder-info-muted focus:border-actions-primary focus:ring-actions-primary h-9 w-full rounded-full border pl-9 pr-4 text-sm text-white focus:outline-none focus:ring-1"
              value={filterValues.patientName || ''}
              onChange={e => {
                setFilterValues({ ...filterValues, patientName: e.target.value, pageNumber: 1 });
              }}
            />
          </div>
          <ViewModeToggle
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>
      }
    >
      <div className="p-4">
        {/* Filters Area */}
        <div className="mb-6 flex items-center gap-4">
          <FilterPresets
            presets={[
              { id: 'all', label: 'All Studies', filterValues: {} },
              {
                id: 'today',
                label: 'Today',
                filterValues: {
                  studyDate: {
                    startDate: moment().format('YYYYMMDD'),
                    endDate: moment().format('YYYYMMDD'),
                  },
                },
              },
              { id: 'ct', label: 'CT', filterValues: { modalities: ['CT'] } },
              { id: 'mr', label: 'MR', filterValues: { modalities: ['MR'] } },
            ]}
            activePresetId="all"
            onPresetSelected={handlePresetSelected}
          />
        </div>

        {/* Study List View */}
        {isLoadingData ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {Array(10)
              .fill(0)
              .map((_, i) => (
                <SkeletonLoader
                  key={i}
                  className="bg-bkg-med/50 h-48 w-full rounded-xl"
                />
              ))}
          </div>
        ) : (
          <StudyListView
            studies={studies || []}
            viewMode={viewMode}
            onStudyClick={handleStudyClick}
          />
        )}

        {/* Pagination */}
        {!isLoadingData && studies && studies.length > 0 && (
          <div className="mt-8 flex justify-center">
            <StudyListPagination
              onChangePage={onPageNumberChange}
              onChangePerPage={onRowsPerPageChange}
              currentPage={pageNumber}
              perPage={resultsPerPage}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
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
  dataTotal: PropTypes.number,
  hotkeysManager: PropTypes.object,
  dataPath: PropTypes.string,
  onRefresh: PropTypes.func,
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

export default WorkList;
