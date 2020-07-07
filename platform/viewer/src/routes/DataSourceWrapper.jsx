/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { MODULE_TYPES } from '@ohif/core';
//
import { useAppConfig } from '@state';
import { extensionManager } from '../App.jsx';

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
  const queryFilterValues = _getQueryFilterValues(history.location.search);

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
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    // 204: no content
    async function getData() {
      setIsLoading(true);
      const searchResults = await dataSource.query.studies.search(
        queryFilterValues
      );
      setData(searchResults);
      setIsLoading(false);
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
      data={data}
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
