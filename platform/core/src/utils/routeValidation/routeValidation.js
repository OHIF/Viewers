import log from '../../log.js';

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
 * @typedef ValidatorsGenerator Generate validator methods.
 * @type {function}
 * @yields {function} validator function
 */

class RouteValidation {
  /**
   *
   * It handles a unsuccessfully validation. It can log message or throw an exception
   *
   * @param {string} message error message
   * @throws Will throw an error validation fails and ROUTES_VALIDATION_MODE is set to fail mode.
   */
  onValidationFail = message => {
    const routesValidationMode = process.env.ROUTES_VALIDATION_MODE;
    switch (routesValidationMode) {
      case 'silent':
        break;
      case 'log':
        log.error(message);
        break;
      case 'fail':
        throw new Error(message);
      default:
        log.info(message);
    }
  };

  /**
   * Generic method to run validators.
   *
   * @param {ValidatorsGenerator} validators Iterable structure with validators to be processed
   * @param {RoutesDefinitions} routesDefinitions
   * @return {boolean} true in case of success or false in case failure and ROUTES_VALIDATION_MODE is not on fail mode
   * @throws Will throw an error if any validation fails and ROUTES_VALIDATION_MODE is set to fail mode.
   */
  runValidators = (validators, routesDefinitions) => {
    for (let validator of validators()) {
      const valid = validator(routesDefinitions);
      // no need to wait, break immediately
      if (!valid) {
        return false;
      }
    }

    return true;
  };
}

export default RouteValidation;
