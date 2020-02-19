import OHIF from '@ohif/core';
const { urlUtil: UrlUtil } = OHIF.utils;

const reload = () => window.location.reload();

const findRouteTemplateModule = (routesTemplateModules, templateKey) => {
  for (let routesTemplateModuleKey in routesTemplateModules) {
    const _module = routesTemplateModules[routesTemplateModuleKey].module;
    if (_module && templateKey in _module) {
      return _module[templateKey];
    }
  }
};

const pathUniquenessValidation = routesDefinitions => {
  const pathMappings = [];
  for (let routeDefinitionKey in routesDefinitions) {
    const routeDefinition = routesDefinitions[routeDefinitionKey];
    const currentPath = routeDefinition.path;
    const arrayLikeCurrentPath = !Array.isArray(currentPath)
      ? [currentPath]
      : currentPath;

    arrayLikeCurrentPath.forEach(_currentPath => {
      if (_currentPath && _currentPath in pathMappings) {
        handleValidation(
          `RoutesDefinition error: Path ${_currentPath} already registered`
        );
      } else if (_currentPath) {
        pathMappings[_currentPath] = true;
      }
    });
  }

  return true;
};
const handleValidation = message => {
  const routesValidationMode = process.env.ROUTES_VALIDATION_MODE;
  switch (routesValidationMode) {
    case 'silent':
      break;
    case 'log':
      console.error(message);
      break;
    case 'fail':
      throw new Error(message);
    default:
      console.log(message);
  }
};

const preValidation = routesDefinitions => {
  function* validators() {
    yield pathUniquenessValidation;
  }

  runValidation(validators, routesDefinitions);
};

const runValidation = (validators, routesDefinitions) => {
  for (let validator of validators()) {
    const valid = validator(routesDefinitions);
    if (!valid) {
      return;
    }
  }
};
const getRoutes = (appConfig, routesTemplateModules) => {
  const routes = [];
  const routesExistingMap = [];

  const routesDefinitions = {
    ...defaultRoutesDefinitions,
    ...(appConfig.routes || {}),
  };

  try {
    preValidation(routesDefinitions);

    for (let templateKey in routesDefinitions) {
      const routeDefinition = routesDefinitions[templateKey];

      if (!routeDefinition) {
        continue;
      }

      // allowed one route path only.
      if (routesExistingMap[routeDefinition.path]) {
        continue;
      }

      const routeModule = findRouteTemplateModule(
        routesTemplateModules,
        templateKey
      );

      if (routeModule) {
        const validRoute =
          typeof routeDefinition.condition === 'function'
            ? routeDefinition.condition(appConfig)
            : true;

        if (validRoute) {
          routesExistingMap[routeDefinition.path] = true;
          routes.push({
            path: routeDefinition.path,
            Component: routeModule.component,
            props: routeModule.props,
          });
        }
      }
    }
  } catch (e) {
    console.log(e);
  }

  return routes;
};

const parsePath = (path, server, params) => {
  let _path = path;
  const _paramsCopy = Object.assign({}, server, params);

  for (let key in _paramsCopy) {
    _path = UrlUtil.paramString.replaceParam(_path, key, _paramsCopy[key]);
  }

  return _path;
};

const parseViewerPath = (appConfig = {}, server = {}, params) => {
  let viewerPath = ROUTES_DEF.default.viewer.path;
  if (appConfig.enableGoogleCloudAdapter) {
    viewerPath = ROUTES_DEF.gcloud.viewer.path;
  }

  return parsePath(viewerPath, server, params);
};

const parseStudyListPath = (appConfig = {}, server = {}, params) => {
  let studyListPath = ROUTES_DEF.default.list.path;
  if (appConfig.enableGoogleCloudAdapter) {
    studyListPath = ROUTES_DEF.gcloud.list.path || studyListPath;
  }

  return parsePath(studyListPath, server, params);
};

export { getRoutes, parseViewerPath, parseStudyListPath, reload };
