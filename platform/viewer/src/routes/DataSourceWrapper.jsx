/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import PropTypes from 'prop-types';
import { MODULE_TYPES } from '@ohif/core';
//
import { appConfig, extensionManager } from '../App.js';

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

  // const studies = dataSource.query.studies.search();

  // console.log(studies);

  return (
    <React.Fragment>
      <LayoutTemplate {...rest} />
    </React.Fragment>
  );
}

DataSourceWrapper.propTypes = {
  /** Layout Component to wrap with a Data Source */
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.func]).isRequired,
};

export default DataSourceWrapper;
