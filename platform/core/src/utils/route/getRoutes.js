import PathValidationUtils from './pathValidation';
import isTemplateNameEqual from './isTemplateNameEqual';
import getRoutesDefinitions from './getRoutesDefinitions';
const getRoutes = (
  appConfig,
  routeTemplatesModulesExtensions,
  defaultRoutesDefinitions
) => {
  const routes = [];
  const routesExistingMap = [];
  const routesDefinitions = getRoutesDefinitions(
    appConfig,
    defaultRoutesDefinitions
  );

  try {
    PathValidationUtils.runPreValidation(routesDefinitions);

    for (let routeDefinition of routesDefinitions) {
      if (!routeDefinition) {
        continue;
      }

      // allowed one route path only.
      if (routesExistingMap[routeDefinition.path]) {
        continue;
      }

      const routeModule = _findRouteTemplatesModule(
        routeTemplatesModulesExtensions,
        routeDefinition.name
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
            Component: routeModule.template,
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

/**
 * Find RouteTemplatesModule of given templateName from routeTemplatesModulesExtensions param.
 * Returns undefined in case not found.
 * @param {RouteTemplatesExtensions} routeTemplatesModulesExtensions structure to look into
 * @param {string} templateName identifier to look for
 * @return {RouteTemplatesModule} found template module
 */
function _findRouteTemplatesModule(
  routeTemplatesModulesExtensions,
  templateName
) {
  for (let moduleExtensionKey in routeTemplatesModulesExtensions) {
    const _module = routeTemplatesModulesExtensions[moduleExtensionKey].module;

    if (_module) {
      for (let routeTemplatesModule of _module) {
        if (isTemplateNameEqual(routeTemplatesModule.name, templateName)) {
          return routeTemplatesModule;
        }
      }
    }
  }
}

export default getRoutes;
