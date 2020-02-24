import RouteValidation from './routeValidation';

/**
 *
 * @typedef RouteDefinition It defines the route in overall terms
 * @type {object}
 * @property {string} name identifier for given routeDefinition
 * @property {string} path it defines path for given routeDefinition
 *
 *
 * @typedef RoutesDefinitions Array of Routes Definitions
 * @type {RouteDefinition[]}
 *
 */

class PathValidation extends RouteValidation {
  /**
   ** It generates validator functions.
   *
   * @generator
   * @yields {function} specific validator method
   */
  preValidators = function*() {
    yield this.uniquenessValidation;
    yield this.existingHomeValidation;
  };

  /**
   * Run set of pre validation methods
   * @param {RoutesDefinitions} routesDefinitions
   * @return {boolean} true in case of success or false in case failure and ROUTES_VALIDATION_MODE is not on fail mode
   * @throws Will throw an error if validation fails and ROUTES_VALIDATION_MODE is set to fail mode.
   */
  runPreValidation = routesDefinitions => {
    return this.runValidators(this.preValidators.bind(this), routesDefinitions);
  };
  /**
   * Validation method for path. Validate if paths are unique.
   *
   * @param {RoutesDefinitions} routesDefinitions
   * @return {boolean} return true in case validation pass
   * @throws Will throw an error validation fails and ROUTES_VALIDATION_MODE is set to fail mode.
   */
  uniquenessValidation = (routesDefinitions = []) => {
    const existingPaths = [];
    let valid = true;

    for (let routeDefinition of routesDefinitions) {
      const currentPath = routeDefinition.path;

      const arrayLikeCurrentPath = !Array.isArray(currentPath)
        ? [currentPath]
        : currentPath;

      arrayLikeCurrentPath.forEach(_currentPath => {
        if (_currentPath && _currentPath in existingPaths) {
          this.onValidationFail(
            `RoutesDefinition error: Path ${_currentPath} already registered`
          );
          valid = false;
        } else if (_currentPath) {
          existingPaths[_currentPath] = true;
        }
      });
    }

    return valid && routesDefinitions.length > 0;
  };

  existingHomeValidation = (routesDefinitions = []) => {
    let valid = false;
    for (let routeDefinition of routesDefinitions) {
      const currentPath = routeDefinition.path;

      const arrayLikeCurrentPath = !Array.isArray(currentPath)
        ? [currentPath]
        : currentPath;

      for (let _currentPath of arrayLikeCurrentPath) {
        if (_currentPath === '/') {
          return true;
        }
      }
    }
    // in case not found
    this.onValidationFail(
      `RoutesDefinition error: There is no home path registered. We strongly recommend to set up it.`
    );

    return false;
  };
}

const PathValidationUtils = new PathValidation();

export default PathValidationUtils;
