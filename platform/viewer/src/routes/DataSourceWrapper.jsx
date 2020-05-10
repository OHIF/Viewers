/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { MODULE_TYPES } from '@ohif/core';
//
import { appConfig, extensionManager } from '../App.js';
import { useQuery } from './../hooks';

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
  const query = useQuery();
  const queryFilterValues = _getQueryFilterValues(query);

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

  console.log(dataSource, 'dsm');

  // Route props --> studies.mapParams
  // mapParams --> studies.search
  // studies.search --> studies.processResults
  // studies.processResults --> <LayoutTemplate studies={} />
  // But only for LayoutTemplate type of 'list'?
  // Or no data fetching here, and just hand down my source
  const [data, setData] = useState();
  useEffect(() => {

    // 204: no content
    async function getData() {
      const searchResult = await dataSource.query.studies.search({
        patientName: queryFilterValues.patientName,
      });
      setData(searchResult);
    }

    try {
      getData();
    } catch (ex) {
      console.warn(ex);

    }
    console.log('DataSourceWrapper: useEffect');
  }, []);
  // queryFilterValues

  console.log(rest);

  return (
    <React.Fragment>
      {data && <LayoutTemplate {...rest} data={data} />}
    </React.Fragment>
  );
}

DataSourceWrapper.propTypes = {
  /** Layout Component to wrap with a Data Source */
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.func]).isRequired,
};

export default DataSourceWrapper;

/**
 * Duplicated in `studyListContainer`
 * Need generic that can be shared? Isn't this what qs is for?
 * @param {*} query
 */
function _getQueryFilterValues(query) {
  const queryFilterValues = {
    patientName: query.get('patientName'),
    // mrn: query.get('mrn'), patientId?
    studyDate: _tryParseDates(query.get('studyDate'), undefined),
    studyDescription: query.get('description'),
    modalitiesInStudy: _tryParseJson(query.get('modality'), undefined),
    accessionNumber: query.get('accession'),
    sortBy: query.get('soryBy'),
    sortDirection: query.get('sortDirection'),
    page: _tryParseInt(query.get('page'), undefined),
    resultsPerPage: _tryParseInt(query.get('resultsPerPage'), undefined),
  };

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

  function _tryParseJson(str, defaultValue) {
    return str ? JSON.parse(str) : defaultValue;
  }

  function _tryParseDates(str, defaultValue) {
    const studyDateObject = _tryParseJson(str, defaultValue);

    if (studyDateObject) {
      studyDateObject.startDate = studyDateObject.startDate
        ? moment(new Date(studyDateObject.startDate))
        : undefined;

      studyDateObject.endDate = studyDateObject.endDate
        ? moment(new Date(studyDateObject.endDate))
        : undefined;
    }

    return studyDateObject;
  }
}
