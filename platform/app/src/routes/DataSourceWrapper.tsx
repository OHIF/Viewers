/* eslint-disable react/jsx-props-no-spreading */
import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Enums, ExtensionManager, MODULE_TYPES, log } from '@ohif/core';
//
import { extensionManager } from '../App';
import { useParams, useLocation } from 'react-router';
import useSearchParams from '../hooks/useSearchParams';
import { useAppConfig } from '@state';

/**
 * Uses route properties to determine the data source that should be passed
 * to the child layout template. In some instances, initiates requests and
 * passes data as props.
 *
 * @param {object} props
 * @param {function} props.children - Layout Template React Component
 */
function DataSourceWrapper(props: withAppTypes) {
  const { servicesManager } = props;
  const { children: LayoutTemplate, ...rest } = props;
  const params = useParams();
  const location = useLocation();
  const lowerCaseSearchParams = useSearchParams({ lowerCaseKeys: true });
  const query = useSearchParams();
  const [appConfig] = useAppConfig();

  // Route props --> studies.mapParams
  // mapParams --> studies.search
  // studies.search --> studies.processResults
  // studies.processResults --> <LayoutTemplate studies={} />
  // But only for LayoutTemplate type of 'list'?
  // Or no data fetching here, and just hand down my source
  const STUDIES_LIMIT = appConfig.queryLimit ?? 101;
  const DEFAULT_DATA = {
    studies: [],
    queryFilterValues: null,
  };

  const getInitialDataSourceName = useCallback(() => {
    // TODO - get the variable from the props all the time...
    let dataSourceName = lowerCaseSearchParams.get('datasources');

    if (!dataSourceName && appConfig.defaultDataSourceName) {
      return '';
    }

    if (!dataSourceName) {
      // Gets the first defined datasource with the right name
      // Mostly for historical reasons - new configs should use the defaultDataSourceName
      const dataSourceModules = extensionManager.modules[MODULE_TYPES.DATA_SOURCE];
      // TODO: Good usecase for flatmap?
      const webApiDataSources = dataSourceModules.reduce((acc, curr) => {
        const mods = [];
        curr.module.forEach(mod => {
          if (mod.type === 'webApi') {
            mods.push(mod);
          }
        });
        return acc.concat(mods);
      }, []);
      dataSourceName = webApiDataSources
        .map(ds => ds.name)
        .find(it => extensionManager.getDataSources(it)?.[0] !== undefined);
    }

    return dataSourceName;
  }, []);

  const [isDataSourceInitialized, setIsDataSourceInitialized] = useState(false);

  // The path to the data source to be used in the URL for a mode (e.g. mode/dataSourcePath?StudyIntanceUIDs=1.2.3)
  const [dataSourcePath, setDataSourcePath] = useState(() => {
    const dataSourceName = getInitialDataSourceName();
    return dataSourceName ? `/${dataSourceName}` : '';
  });

  const [dataSource, setDataSource] = useState(() => {
    const dataSourceName = getInitialDataSourceName();

    if (!dataSourceName) {
      return extensionManager.getActiveDataSource()[0];
    }

    const dataSource = extensionManager.getDataSources(dataSourceName)?.[0];
    if (!dataSource) {
      throw new Error(`No data source found for ${dataSourceName}`);
    }

    return dataSource;
  });

  const [data, setData] = useState(DEFAULT_DATA);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * The effect to initialize the data source whenever it changes. Similar to
   * whenever a different Mode is entered, the Mode's data source is initialized, so
   * too this DataSourceWrapper must initialize its data source whenever a different
   * data source is activated. Furthermore, a data source might be initialized
   * several times as it gets activated/deactivated because the location URL
   * might change and data sources initialize based on the URL.
   */
  useEffect(() => {
    const initializeDataSource = async () => {
      await dataSource.initialize({ params, query });
      setIsDataSourceInitialized(true);
    };

    initializeDataSource();
  }, [dataSource]);

  useEffect(() => {
    const dataSourceChangedCallback = () => {
      setIsLoading(false);
      setIsDataSourceInitialized(false);
      setDataSourcePath('');
      setDataSource(extensionManager.getActiveDataSource()[0]);
      // Setting data to DEFAULT_DATA triggers a new query just like it does for the initial load.
      setData(DEFAULT_DATA);
    };

    const sub = extensionManager.subscribe(
      ExtensionManager.EVENTS.ACTIVE_DATA_SOURCE_CHANGED,
      dataSourceChangedCallback
    );
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isDataSourceInitialized) {
      return;
    }

    const queryFilterValues = _getQueryFilterValues(location.search, STUDIES_LIMIT);

    // 204: no content
    async function getData() {
      setIsLoading(true);
      log.time(Enums.TimingEnum.SEARCH_TO_LIST);
      const studies = await dataSource.query.studies.search(queryFilterValues);

      setData({
        studies: studies || [],
        queryFilterValues,
      });
      log.timeEnd(Enums.TimingEnum.SCRIPT_TO_VIEW);
      log.timeEnd(Enums.TimingEnum.SEARCH_TO_LIST);

      setIsLoading(false);
    }

    try {
      // Check if query filters have changed
      // Data is invalid if filters changed (filters, sorting, search terms, etc.)
      // Pagination changes alone should not trigger a refetch since we're using manual pagination
      const filtersChanged = !areQueryFiltersEqual(data.queryFilterValues, queryFilterValues);
      const isDataInvalid = !isLoading && filtersChanged;

      if (isDataInvalid) {
        getData().catch(e => {
          console.error(e);

          const { configurationAPI, friendlyName } = dataSource.getConfig();
          // If there is a data source configuration API, then the Worklist will popup the dialog to attempt to configure it
          // and attempt to resolve this issue.
          if (configurationAPI) {
            return;
          }

          servicesManager.services.uiModalService.show({
            title: 'Data Source Connection Error',
            content: () => {
              return (
                <div className="text-foreground">
                  <p className="text-red-600">Error: {e.message}</p>
                  <p>
                    Please ensure the following data source is configured correctly or is running:
                  </p>
                  <div className="mt-2 font-bold">{friendlyName}</div>
                </div>
              );
            },
          });
        });
      }
    } catch (ex) {
      console.warn(ex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, location, params, isLoading, setIsLoading, dataSource, isDataSourceInitialized]);
  // queryFilterValues

  // TODO: Better way to pass DataSource?
  return (
    <LayoutTemplate
      {...rest}
      data={data.studies}
      dataPath={dataSourcePath}
      dataSource={dataSource}
      isLoadingData={isLoading}
      // To refresh the data, simply reset it to DEFAULT_DATA which invalidates it and triggers a new query to fetch the data.
      onRefresh={() => setData(DEFAULT_DATA)}
    />
  );
}

DataSourceWrapper.propTypes = {
  /** Layout Component to wrap with a Data Source */
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.func]).isRequired,
};

export default DataSourceWrapper;

/**
 * Compares two queryFilterValues objects
 * Returns true if they are the same, false otherwise.
 * @param {object} query1 - First query filter values object
 * @param {object} query2 - Second query filter values object
 * @returns {boolean} - True if filters are equal, false otherwise
 */
function areQueryFiltersEqual(query1, query2) {
  if (!query1 || !query2) {
    return query1 === query2; // Both null/undefined or one is null
  }

  // Get all keys from both objects
  const allKeys = new Set([...Object.keys(query1), ...Object.keys(query2)]);

  for (const key of allKeys) {
    const val1 = query1[key];
    const val2 = query2[key];

    // Handle array comparison (e.g., modalitiesInStudy)
    if (Array.isArray(val1) && Array.isArray(val2)) {
      if (val1.length !== val2.length) {
        return false;
      }
      const sorted1 = [...val1].sort().join(',');
      const sorted2 = [...val2].sort().join(',');
      if (sorted1 !== sorted2) {
        return false;
      }
    } else if (val1 !== val2) {
      return false;
    }
  }

  return true;
}

/**
 * Duplicated in `workList`
 * Need generic that can be shared? Isn't this what qs is for?
 * @param {*} query
 */
function _getQueryFilterValues(query, queryLimit) {
  query = new URLSearchParams(query);
  const newParams = new URLSearchParams();
  for (const [key, value] of query) {
    newParams.set(key.toLowerCase(), value);
  }
  query = newParams;

  const queryFilterValues = {
    // DCM
    patientId: query.get('mrn'),
    patientName: query.get('patientname'),
    studyDescription: query.get('description'),
    modalitiesInStudy: query.get('modalities') && query.get('modalities').split(','),
    accessionNumber: query.get('accession'),
    //
    startDate: query.get('startdate'),
    endDate: query.get('enddate'),
    // Rarely supported server-side
    sortBy: query.get('sortby'),
    sortDirection: query.get('sortdirection'),
    // So many different servers out there that we can't rely on them to support offset/limit.
    // So we just query for everything up to the queryLimit for those that support it.
    // For those that don't we will just assume we get everything back.
    offset: 0,
    limit: queryLimit,
  };

  // patientName: good
  // studyDescription: good
  // accessionNumber: good

  // Delete null/undefined keys
  Object.keys(queryFilterValues).forEach(
    key => queryFilterValues[key] == null && delete queryFilterValues[key]
  );

  return queryFilterValues;
}
