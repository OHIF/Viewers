/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { MODULE_TYPES } from '@ohif/core';
//
import { useAppConfig } from '@state';
import { extensionManager } from '../App.jsx';

let cacheMap = {};
let total = {};

/**
 * Uses route properties to determine the data source that should be passed
 * to the child layout template. In some instances, initiates requests and
 * passes data as props.
 *
 * @param {object} props
 * @param {function} props.children - Layout Template React Component
 */
function DataSourceWrapper(props) {
  const [appConfig] = useAppConfig();
  const { children: LayoutTemplate, history, ...rest } = props;
  // TODO: Fetch by type, name, etc?
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

  // Grabbing first for now. This isn't hydrated yet, but we should
  // hydrate it somewhere based on config...
  // ~ default.js
  const firstAppConfigDataSource = appConfig.dataSources[0];
  const dataSourceConfig = firstAppConfigDataSource.configuration;
  const firstWebApiDataSource = webApiDataSources[0];
  const dataSource = firstWebApiDataSource.createDataSource(dataSourceConfig);

  // Route props --> studies.mapParams
  // mapParams --> studies.search
  // studies.search --> studies.processResults
  // studies.processResults --> <LayoutTemplate studies={} />
  // But only for LayoutTemplate type of 'list'?
  // Or no data fetching here, and just hand down my source
  const STUDIES_LIMIT = 101;
  const [data, setData] = useState({ studies: [], total: 0 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 204: no content
    async function getData() {
      setIsLoading(true);

      const limit = STUDIES_LIMIT - 1;
      const queryFilterValues = _getQueryFilterValues(history.location.search);
      const { resultsPerPage = 25, pageNumber = 1 } = queryFilterValues;
      const reachedLimits = parseInt((resultsPerPage * pageNumber) / STUDIES_LIMIT);
      const cacheKey = `${pageNumber}-${resultsPerPage}`;

      const getFromCache = async ({ cacheKey, pageNumber, resultsPerPage, limit, options }) => {
        const pagesAmount = limit / resultsPerPage;
        const pageToRequest = parseInt((resultsPerPage * pageNumber) / STUDIES_LIMIT);

        let length = 0;
        if (!cacheMap[cacheKey]) {
          length = pageToRequest > 0 ? (pageToRequest * STUDIES_LIMIT) : 1;
          const studiesPromise = dataSource.query.studies.search(options);

          for (let pageNum = 0; pageNum < pagesAmount; pageNum++) {
            const currentPageNumber = (pageNum + 1) + (pageToRequest * pagesAmount);
            cacheMap[`${currentPageNumber}-${resultsPerPage}`] = studiesPromise.then(function (results) {
              const slicedResult = results.slice((pageNum * resultsPerPage), ((pageNum + 1) * resultsPerPage));
              length += slicedResult.length;
              return slicedResult;
            });
          }
        }

        const cache = await cacheMap[cacheKey];
        return { cache, length, index: pageToRequest };
      };

      const { cache: studies, index, length } = await getFromCache({
        cacheKey,
        pageNumber,
        resultsPerPage,
        limit,
        options: { ...queryFilterValues, ...{ offset: reachedLimits * limit } }
      });

      const totalKey = `${resultsPerPage}-${index}`;
      total[totalKey] = total[totalKey] ? total[totalKey] + length : length;
      const totals = Object.keys(total).map(key => total[key]);
      const biggestIndex = totals.indexOf(Math.max(...totals));
      const biggestKey = Object.keys(total)[biggestIndex];
      const biggestTotal = total[biggestKey];

      setIsLoading(false);
      setData({ studies, total: biggestTotal });
    }

    try {
      getData();
    } catch (ex) {
      console.warn(ex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.location.search]);
  // queryFilterValues

  // TODO: Better way to pass DataSource?
  return (
    <LayoutTemplate
      {...rest}
      history={history}
      data={data.studies}
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
function _getQueryFilterValues(query) {
  query = new URLSearchParams(query);

  const queryFilterValues = {
    // DCM
    patientId: query.get('mrn'),
    patientName: query.get('patientName'),
    studyDescription: query.get('description'),
    modalitiesInStudy: query.get('modalities') && query.get('modalities').split(','),
    accessionNumber: query.get('accession'),
    //
    startDate: query.get('startDate'),
    endDate: query.get('endDate'),
    page: _tryParseInt(query.get('page'), undefined),
    pageNumber: _tryParseInt(query.get('pageNumber'), undefined),
    resultsPerPage: _tryParseInt(query.get('resultsPerPage'), undefined),
    // Rarely supported server-side
    sortBy: query.get('sortBy'),
    sortDirection: query.get('sortDirection'),
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
    var retValue = defaultValue;
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
