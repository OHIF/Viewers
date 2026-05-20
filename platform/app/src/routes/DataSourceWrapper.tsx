/* eslint-disable react/jsx-props-no-spreading */
import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Enums, ExtensionManager, MODULE_TYPES, log } from '@ohif/core';
//
import { extensionManager } from '../App';
import { useParams, useLocation } from 'react-router';
import useSearchParams from '../hooks/useSearchParams';
import { useAppConfig } from '@state';
import { shallowEqualIgnoringArrayOrder } from '../utils/shallowEqualIgnoringArrayOrder';
import { URL_KEYS, getUrlParam } from '../utils/studyListFilterContract';

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
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

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
      setHasFetchedOnce(false);
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
      setHasFetchedOnce(true);
      log.timeEnd(Enums.TimingEnum.SCRIPT_TO_VIEW);
      log.timeEnd(Enums.TimingEnum.SEARCH_TO_LIST);

      setIsLoading(false);
    }

    try {
      // Refetch when the filter set has actually changed. Filters can include
      // array-valued fields like `modalitiesInStudy` whose element order
      // doesn't matter, so we compare with an unordered-array shallow equal
      // rather than reference equality — otherwise a re-render that
      // re-creates the array with the same contents would force a refetch.
      // Pagination changes alone don't invalidate the data (we paginate
      // client-side).
      const filtersChanged = !shallowEqualIgnoringArrayOrder(
        data.queryFilterValues,
        queryFilterValues
      );
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
      dataTotal={data.studies.length}
      dataPath={dataSourcePath}
      dataSource={dataSource}
      isLoadingData={isLoading}
      hasFetchedOnce={hasFetchedOnce}
      // To refresh the data, simply reset it to DEFAULT_DATA which invalidates it and triggers a new query to fetch the data.
      onRefresh={() => {
        setHasFetchedOnce(false);
        setData(DEFAULT_DATA);
      }}
    />
  );
}

DataSourceWrapper.propTypes = {
  /** Layout Component to wrap with a Data Source */
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.func]).isRequired,
};

export default DataSourceWrapper;

/**
 * Translates the URL query string into the filter shape expected by the
 * data source (`patientId`, `patientName`, `modalitiesInStudy`, …).
 *
 * URL keys come from the centralized contract in `studyListFilterContract.ts`,
 * which is also what WorkList's URL serializer writes — so the read/write
 * sides can't drift.
 *
 * @param {*} query - URL search string or `URLSearchParams`
 */
function _getQueryFilterValues(query, queryLimit) {
  const params = new URLSearchParams(query);
  const modalities = getUrlParam(params, URL_KEYS.modalities);

  const queryFilterValues = {
    // DCM
    patientId: getUrlParam(params, URL_KEYS.mrn),
    patientName: getUrlParam(params, URL_KEYS.patientName),
    studyDescription: getUrlParam(params, URL_KEYS.description),
    modalitiesInStudy: modalities ? modalities.split(',') : null,
    accessionNumber: getUrlParam(params, URL_KEYS.accession),
    //
    startDate: getUrlParam(params, URL_KEYS.startDate),
    endDate: getUrlParam(params, URL_KEYS.endDate),
    // Rarely supported server-side
    sortBy: getUrlParam(params, URL_KEYS.sortBy),
    sortDirection: getUrlParam(params, URL_KEYS.sortDirection),
    // So many different servers out there that we can't rely on them to support offset/limit.
    // So we just query for everything up to the queryLimit for those that support it.
    // For those that don't we will just assume we get everything back.
    offset: 0,
    limit: queryLimit,
  };

  // Delete null/undefined keys
  Object.keys(queryFilterValues).forEach(
    key => queryFilterValues[key] == null && delete queryFilterValues[key]
  );

  return queryFilterValues;
}
