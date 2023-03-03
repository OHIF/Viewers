/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { MODULE_TYPES } from '@ohif/core';
//
import { extensionManager } from '../App.tsx';
import { useParams, useLocation } from 'react-router';

/**
 * Uses route properties to determine the data source that should be passed
 * to the child layout template. In some instances, initiates requests and
 * passes data as props.
 *
 * @param {object} props
 * @param {function} props.children - Layout Template React Component
 */
function DataSourceWrapper(props) {
  const { children: LayoutTemplate, ...rest } = props;
  const params = useParams();
  const location = useLocation();

  // TODO - get the variable from the props all the time...
  let dataSourceName = new URLSearchParams(location.search).get('datasources');
  const dataPath = dataSourceName ? `/${dataSourceName}` : '';

  if (!dataSourceName && window.config.defaultDataSourceName) {
    dataSourceName = window.config.defaultDataSourceName;
  } else if (!dataSourceName) {
    // Gets the first defined datasource with the right name
    // Mostly for historical reasons - new configs should use the defaultDataSourceName
    const dataSourceModules =
      extensionManager.modules[MODULE_TYPES.DATA_SOURCE];
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
  const dataSource = extensionManager.getDataSources(dataSourceName)?.[0];
  if (!dataSource) {
    throw new Error(`No data source found for ${dataSourceName}`);
  }

  // Route props --> studies.mapParams
  // mapParams --> studies.search
  // studies.search --> studies.processResults
  // studies.processResults --> <LayoutTemplate studies={} />
  // But only for LayoutTemplate type of 'list'?
  // Or no data fetching here, and just hand down my source
  const STUDIES_LIMIT = 101;
  const [data, setData] = useState({
    studies: [],
    total: 0,
    resultsPerPage: 25,
    pageNumber: 1,
    location: 'Not a valid location, causes first load to occur',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const queryFilterValues = _getQueryFilterValues(
      location.search,
      STUDIES_LIMIT
    );

    // 204: no content
    async function getData() {
      setIsLoading(true);
      const studies = await dataSource.query.studies.search(queryFilterValues);

      setData({
        studies: studies || [],
        total: studies.length,
        resultsPerPage: queryFilterValues.resultsPerPage,
        pageNumber: queryFilterValues.pageNumber,
        location,
      });

      setIsLoading(false);
    }

    try {
      // Cache invalidation :thinking:
      // - Anytime change is not just next/previous page
      // - And we didn't cross a result offset range
      const isSamePage = data.pageNumber === queryFilterValues.pageNumber;
      const previousOffset =
        Math.floor((data.pageNumber * data.resultsPerPage) / STUDIES_LIMIT) *
        (STUDIES_LIMIT - 1);
      const newOffset =
        Math.floor(
          (queryFilterValues.pageNumber * queryFilterValues.resultsPerPage) /
            STUDIES_LIMIT
        ) *
        (STUDIES_LIMIT - 1);
      const isLocationUpdated = data.location !== location;
      const isDataInvalid =
        !isSamePage ||
        (!isLoading && (newOffset !== previousOffset || isLocationUpdated));

      if (isDataInvalid) {
        getData();
      }
    } catch (ex) {
      console.warn(ex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, location, params, isLoading, setIsLoading]);
  // queryFilterValues

  // TODO: Better way to pass DataSource?
  return (
    <LayoutTemplate
      {...rest}
      data={data.studies}
      dataPath={dataPath}
      dataTotal={data.total}
      dataSource={dataSource}
      isLoadingData={isLoading}
    />
  );
}

DataSourceWrapper.propTypes = {
  /** Layout Component to wrap with a Data Source */
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.func]).isRequired,
};

export default DataSourceWrapper;

/**
 * Duplicated in `workList`
 * Need generic that can be shared? Isn't this what qs is for?
 * @param {*} query
 */
function _getQueryFilterValues(query, queryLimit) {
  query = new URLSearchParams(query);

  const pageNumber = _tryParseInt(query.get('pageNumber'), 1);
  const resultsPerPage = _tryParseInt(query.get('resultsPerPage'), 25);

  const queryFilterValues = {
    // DCM
    patientId: query.get('mrn'),
    patientName: query.get('patientName'),
    studyDescription: query.get('description'),
    modalitiesInStudy:
      query.get('modalities') && query.get('modalities').split(','),
    accessionNumber: query.get('accession'),
    //
    startDate: query.get('startDate'),
    endDate: query.get('endDate'),
    page: _tryParseInt(query.get('page'), undefined),
    pageNumber,
    resultsPerPage,
    // Rarely supported server-side
    sortBy: query.get('sortBy'),
    sortDirection: query.get('sortDirection'),
    // Offset...
    offset:
      Math.floor((pageNumber * resultsPerPage) / queryLimit) * (queryLimit - 1),
  };

  // patientName: good
  // studyDescription: good
  // accessionNumber: good

  // Delete null/undefined keys
  Object.keys(queryFilterValues).forEach(
    key => queryFilterValues[key] == null && delete queryFilterValues[key]
  );

  return queryFilterValues;

  function _tryParseInt(str, defaultValue) {
    let retValue = defaultValue;
    if (str !== null) {
      if (str.length > 0) {
        if (!isNaN(str)) {
          retValue = parseInt(str);
        }
      }
    }
    return retValue;
  }
}
