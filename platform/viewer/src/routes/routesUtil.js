import OHIF from '@ohif/core';

const OHIF_UTILS = OHIF.utils;

const reload = () => window.location.reload();
/**
 *
 * @typedef RouteDefinition It defines the route in overall terms
 * @type {object}
 * @property {string} template identifier for given routeDefinition
 * @property {string} path it defines path for given routeDefinition
 *
 *
 * @typedef RoutesDefinitions Array of Routes Definitions
 * @type {RouteDefinition[]}
 *
 * @typedef RouteTemplateExtensionModuleItem It defines a route in terms of React application level. I.e it shall contain component, props and other React Component related properties
 * @type {object}
 * @property {string} template identifier for given routeTemplatesModule
 * @property {*} component react component to be used
 * @property {object} props use the related props when creating given component
 *
 * @typedef RouteTemplateExtension
 * @type {object}
 * @property {RouteTemplateExtensionModuleItem[]} module contains routes templates items for given route template extension
 *
 *
 * @typedef RouteTemplatesExtensions extensions defined for routeTemplate type
 * @type {object<*, RouteTemplateExtension>}
 *
 */

/**
 * @type {RoutesDefinitions}
 * @description Default Routes Definitions. In case there is no definition at app config level, this will be used.
 * At same way, if there is a RouteDefinition at app config level then it will be used instead of any existing definition from default values.
 */
const defaultRoutesDefinitions = [
  {
    name: 'Viewer',
    path: '/viewer/:studyInstanceUids',
  },
  {
    name: 'standAloneViewer',
    path: '/viewer',
  },
  {
    name: 'StudyList',
    path: ['/', '/studylist'],
  },
  {
    name: 'Local',
    path: '/local',
  },
  {
    name: 'IHEInvokeImageDisplay',
    path: '/IHEInvokeImageDisplay',
  },
  {
    name: 'GCloudViewer',
    path:
      '/projects/:project/locations/:location/datasets/:dataset/dicomStores/:dicomStore/study/:studyInstanceUids',
  },
  {
    name: 'GCloudStudyList',
    path:
      '/projects/:project/locations/:location/datasets/:dataset/dicomStores/:dicomStore',
  },
];

/**
 * @typedef RouteType It defines an object to be consumed by application and build routes with it.
 * @type {object}
 * @property {string} path path for given routeType
 * @property {*} component React Component to be rendered in case this route should display
 * @property {object} props React Component props to be passed to component
 *
 * It will return an array of possible routes.
 * It combines route definitions and route template to produce a single route entry.
 *
 * It uses default configuration for definitions @see {@link defaultRoutesDefinitions} and also can use specific configuration (from params)
 *
 * @param {*} appConfig app configuration. Any specific route definition must come here
 * @param {RouteTemplatesExtensions} routeTemplatesModulesExtensions it contains routes templates extension (default and any specific one)
 * @return {RouteType[]}
 */
const getRoutes = (appConfig, routeTemplatesModulesExtensions) => {
  return OHIF_UTILS.getRoutes(
    appConfig,
    routeTemplatesModulesExtensions,
    defaultRoutesDefinitions
  );
};

const parseViewerPath = (appConfig = {}, server = {}, params) => {
  const routesDefinitions = OHIF_UTILS.getRoutesDefinitions(
    appConfig,
    defaultRoutesDefinitions
  );

  let viewerRouteDefinition = _findRouteDefinition(routesDefinitions, 'viewer');
  let viewerPath = viewerRouteDefinition.path;
  if (appConfig.enableGoogleCloudAdapter) {
    viewerRouteDefinition = _findRouteDefinition(
      routesDefinitions,
      'GCloudViewer'
    );
    viewerPath = viewerRouteDefinition.path;
  }

  const _viewerPath = Array.isArray(viewerPath) ? viewerPath[0] : viewerPath;
  return _parsePath(_viewerPath, server, params);
};

const parseStudyListPath = (appConfig = {}, server = {}, params) => {
  const routesDefinitions = OHIF_UTILS.getRoutesDefinitions(
    appConfig,
    defaultRoutesDefinitions
  );

  let viewerRouteDefinition = _findRouteDefinition(
    routesDefinitions,
    'StudyList'
  );
  let studyListPath = viewerRouteDefinition.path;
  if (appConfig.enableGoogleCloudAdapter) {
    viewerRouteDefinition = _findRouteDefinition(
      routesDefinitions,
      'GCloudStudyList'
    );
    studyListPath = viewerRouteDefinition.path || studyListPath;
  }

  const _studyListPath = Array.isArray(studyListPath)
    ? studyListPath[0]
    : studyListPath;
  return _parsePath(_studyListPath, server, params);
};
function _parsePath(path, server, params) {
  let _path = path;
  const _paramsCopy = Object.assign({}, server, params);

  for (let key in _paramsCopy) {
    _path = OHIF_UTILS.urlUtil.paramString.replaceParam(
      _path,
      key,
      _paramsCopy[key]
    );
  }

  return _path;
}

/**
 * Find routeDefinition for given param templateName into routeDefinitions.
 * Returns undefined in case not found.
 * @param {RoutesDefinitions} routeDefinitions structure to look into
 * @param {string} templateName identifier to look for
 * @return {(RoutesDefinition|undefined)}
 */
function _findRouteDefinition(routeDefinitions, templateName) {
  for (let routeDefinition of routeDefinitions) {
    if (OHIF_UTILS.isTemplateNameEqual(routeDefinition.name, templateName)) {
      return routeDefinition;
    }
  }
}

export { getRoutes, parseViewerPath, parseStudyListPath, reload };
